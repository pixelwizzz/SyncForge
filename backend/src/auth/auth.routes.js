import { Router } from 'express';
import { getMe } from './auth.controller.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retrieve the currently logged-in user profile from local database
 * @access  Private (Requires valid Clerk session token)
 */
router.get('/me', authenticate, getMe);

export default router;
