import Task from './task.model.js';
import TeamMember from '../teams/teamMember.model.js';
import User from '../users/user.model.js';
import Attachment from './attachment.model.js';
import cacheService from '../redis/cache.service.js';
import logger from '../utils/logger.js';

class TaskService {
  /**
   * Create a new task.
   */
  async createTask(taskData, creatorId) {
    const { team_id, assignee_id } = taskData;

    // 1. Verify creator is a member of the team
    const isCreatorMember = await TeamMember.findOne({
      where: { team_id, user_id: creatorId },
    });
    if (!isCreatorMember) {
      const error = new Error('Creator is not a member of the target team');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // 2. Verify assignee is a member of the team (if assignee is provided)
    if (assignee_id) {
      const isAssigneeMember = await TeamMember.findOne({
        where: { team_id, user_id: assignee_id },
      });
      if (!isAssigneeMember) {
        const error = new Error('Assignee is not a member of this team');
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }
    }

    // 3. Create task
    const task = await Task.create({
      ...taskData,
      creator_id: creatorId,
    });

    // 4. Invalidate team task cache
    await cacheService.invalidateTeamTasks(team_id);

    return this.getTaskById(task.id);
  }

  /**
   * Get task by ID with full associations (Creator, Assignee, Attachments).
   */
  async getTaskById(taskId) {
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar_url'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar_url'],
        },
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'file_name', 'file_size', 'mime_type', 'created_at'],
        },
      ],
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return task;
  }

  /**
   * Query and filter tasks with pagination.
   */
  async queryTasks(userId, { team_id, status, priority, assignee_id, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    // 1. Enforce team boundary
    if (team_id) {
      // Check if user is a member of this team
      const isMember = await TeamMember.findOne({
        where: { team_id, user_id: userId },
      });
      if (!isMember) {
        const error = new Error('Access denied: You are not a member of this team');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }
      whereClause.team_id = team_id;
    } else {
      // Fetch all teams user belongs to, and fetch tasks for those teams
      const memberships = await TeamMember.findAll({
        where: { user_id: userId },
        attributes: ['team_id'],
      });
      const teamIds = memberships.map((m) => m.team_id);
      
      // If user has no teams, they have no tasks
      if (teamIds.length === 0) {
        return { count: 0, rows: [] };
      }
      whereClause.team_id = teamIds;
    }

    // 2. Dynamic filters
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (assignee_id) whereClause.assignee_id = assignee_id;

    // 3. Cache Check (only for single team queries to maintain safety)
    let cacheKey = null;
    if (team_id) {
      cacheKey = `tasks:team:${team_id}:status:${status || 'all'}:priority:${priority || 'all'}:assignee:${assignee_id || 'all'}:page:${page}:limit:${limit}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.debug(`⚡ Cache Hit for team tasks: ${cacheKey}`);
        return cached;
      }
      logger.debug(`⚡ Cache Miss for team tasks: ${cacheKey}`);
    }

    // 4. Find and count in database
    const { count, rows } = await Task.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar_url'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar_url'],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    const result = {
      total: count,
      tasks: rows,
    };

    // 5. Store in cache for 1 hour
    if (cacheKey) {
      await cacheService.set(cacheKey, result, 3600);
    }

    return result;
  }

  /**
   * Update task.
   */
  async updateTask(taskId, updateData, userId) {
    const task = await this.getTaskById(taskId);

    // 1. Verify user is member of the task's team
    const isMember = await TeamMember.findOne({
      where: { team_id: task.team_id, user_id: userId },
    });
    if (!isMember) {
      const error = new Error('Access denied: You are not a member of the task\'s team');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // 2. Verify assignee is a member of the team (if changing assignee)
    if (updateData.assignee_id) {
      const isAssigneeMember = await TeamMember.findOne({
        where: { team_id: task.team_id, user_id: updateData.assignee_id },
      });
      if (!isAssigneeMember) {
        const error = new Error('Assignee is not a member of this team');
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }
    }

    // 3. Save updates
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        task[key] = updateData[key];
      }
    });

    await task.save();

    // 4. Invalidate cache
    await cacheService.invalidateTeamTasks(task.team_id);

    return this.getTaskById(task.id);
  }

  /**
   * Delete task. Only team Admin/Owner or Creator can delete.
   */
  async deleteTask(taskId, userId) {
    const task = await this.getTaskById(taskId);

    // 1. Fetch user role in the team
    const member = await TeamMember.findOne({
      where: { team_id: task.team_id, user_id: userId },
    });

    if (!member) {
      const error = new Error('Access denied: You are not a member of the task\'s team');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // 2. Check permission: Creator or Admin/Owner
    const isCreator = task.creator_id === userId;
    const isPrivileged = ['owner', 'admin'].includes(member.role);

    if (!isCreator && !isPrivileged) {
      const error = new Error('Access denied: Only the task creator or a team administrator can delete this task');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // 3. Invalidate cache
    await cacheService.invalidateTeamTasks(task.team_id);

    const deletedData = { id: task.id, team_id: task.team_id };
    await task.destroy();
    return deletedData;
  }
}

export default new TaskService();
