import TeamService from './team.service.js';
import { successResponse, createdResponse, noContentResponse } from '../utils/apiResponse.js';

class TeamController {
  /**
   * Create a team.
   */
  createTeam = async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const ownerId = req.dbUser.id;

      const team = await TeamService.createTeam({ name, description, ownerId });

      return createdResponse(res, {
        data: team,
        message: 'Team created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all teams current user belongs to.
   */
  getMyTeams = async (req, res, next) => {
    try {
      const userId = req.dbUser.id;
      const teams = await TeamService.getUserTeams(userId);

      return successResponse(res, {
        data: teams,
        message: 'Teams retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get team details with member listing.
   */
  getTeam = async (req, res, next) => {
    try {
      const teamId = req.params.id;
      const team = await TeamService.getTeamWithMembers(teamId);

      return successResponse(res, {
        data: team,
        message: 'Team details retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Invite or add a member to the team.
   */
  inviteMember = async (req, res, next) => {
    try {
      const teamId = req.params.id;
      const { email, role } = req.body;

      const member = await TeamService.addMember(teamId, email, role);

      return createdResponse(res, {
        data: member,
        message: 'Member added to team successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update team info.
   */
  updateTeam = async (req, res, next) => {
    try {
      const teamId = req.params.id;
      const { name, description } = req.body;

      const team = await TeamService.updateTeam(teamId, { name, description });

      return successResponse(res, {
        data: team,
        message: 'Team updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a team.
   */
  deleteTeam = async (req, res, next) => {
    try {
      const teamId = req.params.id;
      await TeamService.deleteTeam(teamId);

      return noContentResponse(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove a member from the team.
   */
  removeMember = async (req, res, next) => {
    try {
      const teamId = req.params.id;
      const { userId } = req.params;

      await TeamService.removeMember(teamId, userId);

      return noContentResponse(res);
    } catch (error) {
      next(error);
    }
  };
}

export default new TeamController();
