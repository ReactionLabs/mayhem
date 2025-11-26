/**
 * API Middleware Utilities
 * Common middleware for API routes
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sendError, ApiError } from './response';

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

export type ApiMiddleware = (
  handler: ApiHandler
) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * Method validation middleware
 */
export function withMethod(allowedMethods: string[]): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (!allowedMethods.includes(req.method || '')) {
        return sendError(
          res,
          `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
          405
        );
      }
      return handler(req, res);
    };
  };
}

/**
 * Error handling middleware
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(res, error.message, error.statusCode, error.code);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Unhandled API error:', error);
      }
      
      return sendError(
        res,
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  };
}

/**
 * Combine multiple middleware
 */
export function composeMiddleware(...middlewares: ApiMiddleware[]): ApiMiddleware {
  return (handler: ApiHandler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

