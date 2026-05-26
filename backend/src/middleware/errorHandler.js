import logger from '../utils/logger.js';
import { errorResponse, ErrorCodes } from '../utils/apiResponse.js';

/**
 * Global error handler — catches all unhandled errors.
 *
 * Must be registered LAST in the middleware chain (after all routes).
 * Express identifies it as an error handler by its 4-parameter signature.
 */
export default function errorHandler(err, req, res, _next) {
  // Log the full error internally
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    statusCode: err.statusCode || 500,
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors?.map((e) => ({
      field: e.path,
      message: e.message,
    })) || [];

    return errorResponse(res, {
      statusCode: 400,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed',
      details,
    });
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, {
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
      message: 'Referenced resource does not exist',
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, {
      statusCode: 413,
      code: ErrorCodes.FILE_TOO_LARGE,
      message: 'File size exceeds the maximum allowed limit',
    });
  }

  // Clerk authentication errors
  if (err.status === 401 || err.clerkError) {
    return errorResponse(res, {
      statusCode: 401,
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Authentication required',
    });
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, {
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
      message: 'Invalid JSON in request body',
    });
  }

  // Custom application errors (thrown with statusCode)
  if (err.statusCode) {
    return errorResponse(res, {
      statusCode: err.statusCode,
      code: err.code || ErrorCodes.INTERNAL_ERROR,
      message: err.message,
    });
  }

  // Default: Internal Server Error
  const isProduction = process.env.NODE_ENV === 'production';

  return errorResponse(res, {
    statusCode: 500,
    code: ErrorCodes.INTERNAL_ERROR,
    message: isProduction ? 'Internal server error' : err.message,
  });
}
