import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's local database profile.
 * Handled via `authenticate` middleware, which attaches `req.dbUser`.
 */
export async function getMe(req, res) {
  return successResponse(res, {
    user: {
      id: req.dbUser.id,
      clerk_id: req.dbUser.clerk_id,
      name: req.dbUser.name,
      email: req.dbUser.email,
      avatar_url: req.dbUser.avatar_url,
      is_admin: req.dbUser.is_admin,
      created_at: req.dbUser.createdAt,
      updated_at: req.dbUser.updatedAt,
    },
  }, 'User profile retrieved successfully');
}
