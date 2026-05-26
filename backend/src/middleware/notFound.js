import { errorResponse, ErrorCodes } from '../utils/apiResponse.js';

/**
 * 404 handler — catches requests that don't match any route.
 * Must be registered AFTER all routes but BEFORE the error handler.
 */
export default function notFound(req, res) {
  return errorResponse(res, {
    statusCode: 404,
    code: ErrorCodes.NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
