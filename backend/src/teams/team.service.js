import sequelize from '../config/database.js';
import Team from './team.model.js';
import TeamMember from './teamMember.model.js';
import User from '../users/user.model.js';

class TeamService {
  /**
   * Create a new team and assign the creator as the Owner.
   */
  async createTeam({ name, description, ownerId }) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Create the team
      const team = await Team.create({ name, description }, { transaction });

      // 2. Add creator as team owner
      await TeamMember.create({
        team_id: team.id,
        user_id: ownerId,
        role: 'owner',
      }, { transaction });

      await transaction.commit();

      // Return the team along with the newly created owner association
      return this.getTeamById(team.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get a simple team record by ID.
   */
  async getTeamById(teamId) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return team;
  }

  /**
   * Get all teams that a specific user belongs to.
   */
  async getUserTeams(userId) {
    return Team.findAll({
      include: [
        {
          model: TeamMember,
          as: 'members',
          where: { user_id: userId },
          attributes: ['role'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get team details along with its member list (with user details).
   */
  async getTeamWithMembers(teamId) {
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: TeamMember,
          as: 'members',
          attributes: ['id', 'role', 'created_at'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar_url'],
            },
          ],
        },
      ],
    });

    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return team;
  }

  /**
   * Invite a user to a team. User must already exist in local DB.
   */
  async addMember(teamId, email, role) {
    // 1. Check if team exists
    await this.getTeamById(teamId);

    // 2. Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error('User not found. They must sign up first.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // 3. Check if user is already a member
    const existingMember = await TeamMember.findOne({
      where: { team_id: teamId, user_id: user.id },
    });

    if (existingMember) {
      const error = new Error('User is already a member of this team');
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    }

    // 4. Create the membership
    const member = await TeamMember.create({
      team_id: teamId,
      user_id: user.id,
      role,
    });

    return {
      id: member.id,
      team_id: member.team_id,
      role: member.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    };
  }

  /**
   * Update team information.
   */
  async updateTeam(teamId, { name, description }) {
    const team = await this.getTeamById(teamId);
    
    if (name) team.name = name;
    if (description !== undefined) team.description = description;

    await team.save();
    return team;
  }

  /**
   * Delete a team entirely.
   */
  async deleteTeam(teamId) {
    const team = await this.getTeamById(teamId);
    await team.destroy();
    return true;
  }

  /**
   * Remove a member from a team.
   */
  async removeMember(teamId, userId) {
    const member = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId },
    });

    if (!member) {
      const error = new Error('User is not a member of this team');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Cannot remove the owner of the team
    if (member.role === 'owner') {
      const error = new Error('Cannot remove the team owner. The team must be deleted instead, or ownership transferred.');
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    }

    await member.destroy();
    return true;
  }

  /**
   * Get the role of a user in a team.
   */
  async getUserRole(teamId, userId) {
    const member = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId },
    });
    return member ? member.role : null;
  }
}

export default new TeamService();
