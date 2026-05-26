import { errorResponse, ErrorCodes } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import TeamMember from '../teams/teamMember.model.js';

/**
 * Global Admin Authorization Middleware.
 * Enforces that `req.dbUser` exists and has `is_admin === true`.
 * Note: Must be placed AFTER the `authenticate` middleware.
 */
export function authorizeAdmin(req, res, next) {
  if (!req.dbUser) {
    logger.error('authorizeAdmin middleware called, but req.dbUser is undefined. Make sure authenticate middleware is ran first!');
    return errorResponse(res, {
      statusCode: 500,
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Authentication context missing',
    });
  }

  if (!req.dbUser.is_admin) {
    logger.warn(`Access Denied: User ${req.dbUser.id} attempted to access administrator-only route`);
    return errorResponse(res, {
      statusCode: 403,
      code: ErrorCodes.FORBIDDEN,
      message: 'Access denied: Administrator privileges required',
    });
  }

  next();
}

/**
 * Team-scoped Role-Based Access Control Middleware (RBAC).
 * Checks if the authenticated user has one of the allowed roles inside the target team.
 * Must be placed AFTER the `authenticate` middleware.
 *
 * @param {Array<string>} requiredRoles - List of allowed roles (e.g. ['owner', 'admin']). If empty, any role is allowed.
 */
export function authorizeTeamRole(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      if (!req.dbUser) {
        logger.error('authorizeTeamRole middleware called, but req.dbUser is undefined.');
        return errorResponse(res, {
          statusCode: 500,
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Authentication context missing',
        });
      }

      // ── Admin Override ──────────────────────────────────────────
      // Global admins bypass all team-level restrictions
      if (req.dbUser.is_admin) {
        logger.debug(`Admin override: Global admin ${req.dbUser.id} bypassing team role checks`);
        return next();
      }

      // ── Find Team ID ────────────────────────────────────────────
      const teamId = req.params.id || req.params.teamId || req.body.team_id || req.query.team_id;
      if (!teamId) {
        logger.warn('authorizeTeamRole: No teamId found in request parameters, body, or query');
        return errorResponse(res, {
          statusCode: 400,
          code: ErrorCodes.BAD_REQUEST,
          message: 'Team identification is required for this route',
        });
      }

      // ── Fetch Membership ────────────────────────────────────────
      const member = await TeamMember.findOne({
        where: { team_id: teamId, user_id: req.dbUser.id },
      });

      if (!member) {
        logger.warn(`Access Denied: User ${req.dbUser.id} is not a member of Team ${teamId}`);
        return errorResponse(res, {
          statusCode: 403,
          code: ErrorCodes.FORBIDDEN,
          message: 'Access denied: You are not a member of this team',
        });
      }

      // ── Role Verification ───────────────────────────────────────
      if (requiredRoles.length > 0 && !requiredRoles.includes(member.role)) {
        logger.warn(`Access Denied: User ${req.dbUser.id} has role ${member.role} but required ${requiredRoles.join('/')}`);
        return errorResponse(res, {
          statusCode: 403,
          code: ErrorCodes.FORBIDDEN,
          message: 'Access denied: Insufficient team privileges',
        });
      }

      // Attach team member info to request for downstream handlers
      req.teamMembership = member;

      next();
    } catch (error) {
      logger.error('Error in authorizeTeamRole middleware:', error);
      return errorResponse(res, {
        statusCode: 500,
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error during authorization check',
      });
    }
  };
}

