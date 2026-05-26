import { requireAuth } from '@clerk/express';
import { findUserByClerkId } from '../users/user.service.js';
import { errorResponse, ErrorCodes } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Authentication Middleware.
 * 1. Enforces a valid Clerk session JWT using @clerk/express requireAuth().
 * 2. Pulls the corresponding local user from PostgreSQL using the Clerk User ID.
 * 3. Attaches the local user model to `req.dbUser` for downstream routing.
 */
const authenticate = [
  // Stage 1: Enforce Clerk authentication
  requireAuth(),

  // Stage 2: Fetch and attach local database user
  async (req, res, next) => {
    try {
      const clerkId = req.auth.userId;

      if (!clerkId) {
        logger.warn('Clerk requireAuth passed but req.auth.userId is missing');
        return errorResponse(
          res,
          'Unauthorized: Clerk session context missing',
          401,
          ErrorCodes.UNAUTHORIZED
        );
      }

      // Find local database user
      const dbUser = await findUserByClerkId(clerkId);

      if (!dbUser) {
        logger.warn(`Local database user record missing for Clerk User ID: ${clerkId}`);
        return errorResponse(
          res,
          'Account sync incomplete: Local user record not found. Ensure webhook synced successfully.',
          403,
          ErrorCodes.FORBIDDEN
        );
      }

      // Attach database user context to request
      req.dbUser = dbUser;
      next();
    } catch (error) {
      logger.error('Error in authentication middleware:', error);
      return errorResponse(
        res,
        'Internal server error during session authentication',
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }
  },
];

export default authenticate;
export { authenticate };
