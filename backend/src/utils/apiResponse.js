/**
 * Standard API response envelope.
 * All responses follow this shape for consistency:
 *
 * Success: { success: true, data: {...}, meta?: {...}, error: null }
 * Error:   { success: false, data: null, error: { code, message, details } }
 */

export function successResponse(res, { data = null, meta = null, statusCode = 200, message = '' }) {
  const response = {
    success: true,
    data,
    ...(meta && { meta }),
    ...(message && { message }),
    error: null,
  };

  return res.status(statusCode).json(response);
}

export function createdResponse(res, { data = null, message = 'Resource created successfully' }) {
  return successResponse(res, { data, statusCode: 201, message });
}

export function noContentResponse(res) {
  return res.status(204).send();
}

export function errorResponse(res, { statusCode = 500, code = 'INTERNAL_ERROR', message = 'Something went wrong', details = [] }) {
  const response = {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
    },
  };

  return res.status(statusCode).json(response);
}

export function paginatedResponse(res, { data, page, limit, total }) {
  return successResponse(res, {
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

/**
 * Error codes used throughout the application.
 */
export const ErrorCodes = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
});
