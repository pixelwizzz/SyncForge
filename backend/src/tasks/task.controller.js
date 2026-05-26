import TaskService from './task.service.js';
import TeamMember from '../teams/teamMember.model.js';
import { successResponse, createdResponse, noContentResponse, paginatedResponse, errorResponse, ErrorCodes } from '../utils/apiResponse.js';
import { getIo } from '../sockets/socket.init.js';

class TaskController {
  /**
   * Create a task.
   */
  createTask = async (req, res, next) => {
    try {
      const creatorId = req.dbUser.id;
      const task = await TaskService.createTask(req.body, creatorId);

      // ── Socket Broadcast ──────────────────────────────────
      const io = getIo();
      if (io) {
        io.to(`team:${task.team_id}`).emit('task:created', task);
      }

      return createdResponse(res, {
        data: task,
        message: 'Task created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific task's details.
   */
  getTask = async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const userId = req.dbUser.id;

      const task = await TaskService.getTaskById(taskId);

      // Verify user is a member of the task's team
      const isMember = await TeamMember.findOne({
        where: { team_id: task.team_id, user_id: userId },
      });

      if (!isMember && !req.dbUser.is_admin) {
        return errorResponse(res, {
          statusCode: 403,
          code: ErrorCodes.FORBIDDEN,
          message: 'Access denied: You are not a member of the task\'s team',
        });
      }

      return successResponse(res, {
        data: task,
        message: 'Task details retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List and filter tasks (paginated).
   */
  getTasks = async (req, res, next) => {
    try {
      const userId = req.dbUser.id;
      const { team_id, status, priority, assignee_id, page, limit } = req.query;

      const { tasks, total } = await TaskService.queryTasks(userId, {
        team_id,
        status,
        priority,
        assignee_id,
        page,
        limit,
      });

      return paginatedResponse(res, {
        data: tasks,
        page,
        limit,
        total,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update task details or status.
   */
  updateTask = async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const userId = req.dbUser.id;

      const task = await TaskService.updateTask(taskId, req.body, userId);

      // ── Socket Broadcast ──────────────────────────────────
      const io = getIo();
      if (io) {
        io.to(`team:${task.team_id}`).emit('task:updated', task);
      }

      return successResponse(res, {
        data: task,
        message: 'Task updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a task.
   */
  deleteTask = async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const userId = req.dbUser.id;
      const deletedTask = await TaskService.deleteTask(taskId, userId);

      // ── Socket Broadcast ──────────────────────────────────
      const io = getIo();
      if (io) {
        io.to(`team:${deletedTask.team_id}`).emit('task:deleted', { id: deletedTask.id });
      }

      return noContentResponse(res);
    } catch (error) {
      next(error);
    }
  };
}

export default new TaskController();
