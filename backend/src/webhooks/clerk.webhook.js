import { Webhook } from 'svix';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { upsertUser, deleteUser } from '../users/user.service.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/apiResponse.js';

/**
 * Handle POST /api/v1/webhooks/clerk
 * Processes real-time Clerk user sync webhooks.
 */
export async function handleClerkWebhook(req, res) {
  const payload = req.body; // Buffer from express.raw()
  const headers = req.headers;

  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  let evt;

  // ── Development Bypass Option ─────────────────────────────────
  // If we are in dev mode and don't have a webhook secret yet, bypass verification.
  // This allows easy local testing via Postman or webhook simulators.
  if (env.NODE_ENV === 'development' && !env.CLERK_WEBHOOK_SECRET) {
    logger.warn('⚠️ CLERK_WEBHOOK_SECRET is not set. Bypassing signature verification (DEV MODE ONLY).');
    try {
      const rawString = payload.toString('utf8');
      evt = JSON.parse(rawString);
    } catch (error) {
      logger.error('Failed to parse webhook JSON body:', error.message);
      return errorResponse(
        res,
        'Invalid JSON payload',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
  } else {
    // ── Strict Production Verification ────────────────────────────
    if (!svixId || !svixTimestamp || !svixSignature) {
      logger.warn('Rejected webhook: Missing Svix signature headers');
      return errorResponse(
        res,
        'Missing verification headers',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (!env.CLERK_WEBHOOK_SECRET) {
      logger.error('❌ CLERK_WEBHOOK_SECRET is required in production');
      return errorResponse(
        res,
        'Server configuration error',
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }

    try {
      const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
      // Verify signature. svix Webhook expects string or buffer
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (error) {
      logger.error('Webhook signature verification failed:', error.message);
      return errorResponse(
        res,
        'Invalid signature payload',
        400,
        ErrorCodes.UNAUTHORIZED
      );
    }
  }

  // ── Event Processing ──────────────────────────────────────────
  const { type, data } = evt;
  logger.info(`Processing Clerk webhook event: ${type}`);

  try {
    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const email = data.email_addresses?.[0]?.email_address;
        if (!email) {
          logger.warn(`Clerk user webhook missing email address: Clerk ID=${data.id}`);
          return errorResponse(
            res,
            'Missing email in clerk profile data',
            400,
            ErrorCodes.VALIDATION_ERROR
          );
        }

        const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || null;
        const avatar_url = data.image_url || data.profile_image_url || null;

        await upsertUser({
          clerk_id: data.id,
          email,
          name,
          avatar_url,
        });
        break;
      }

      case 'user.deleted': {
        await deleteUser(data.id);
        break;
      }

      default:
        logger.debug(`Clerk webhook event ignored: Unhandled event type (${type})`);
        break;
    }

    return successResponse(res, null, `Clerk webhook (${type}) processed successfully`, 200);
  } catch (error) {
    logger.error(`Error processing webhook event (${type}):`, error);
    return errorResponse(
      res,
      'An error occurred while syncing user data',
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
}
