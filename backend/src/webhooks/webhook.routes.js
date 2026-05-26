import { Router } from 'express';
import { handleClerkWebhook } from './clerk.webhook.js';

const router = Router();

/**
 * @route   POST /api/v1/webhooks/clerk
 * @desc    Receive and parse real-time events from Clerk (User sync)
 * @access  Public (Signature validated internally)
 */
router.post('/clerk', handleClerkWebhook);

export default router;
