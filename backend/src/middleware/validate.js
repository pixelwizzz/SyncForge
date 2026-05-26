import { errorResponse, ErrorCodes } from '../utils/apiResponse.js';

/**
 * Reusable Express middleware to validate request payloads using Zod schemas.
 * Validates body, query, and params.
 * 
 * @param {import('zod').AnyZodObject} schema Zod validation schema.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Assign parsed data back to req to ensure sanitization (strips extra fields)
    req.body = parsed.body || req.body;
    req.query = parsed.query || req.query;
    req.params = parsed.params || req.params;
    
    next();
  } catch (error) {
    const details = error.errors.map((err) => ({
      field: err.path.join('.').replace(/^(body|query|params)\./, ''),
      message: err.message,
    }));

    return errorResponse(res, {
      statusCode: 400,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed',
      details,
    });
  }
};

export default validate;
