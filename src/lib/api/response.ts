/**
 * API Response Utilities
 * Standardized API response helpers for consistent error handling
 */

import { NextApiResponse } from 'next';

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Send a successful API response
 */
export function sendSuccess<T>(
  res: NextApiResponse<ApiResponse<T>>,
  data: T,
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error API response
 */
export function sendError(
  res: NextApiResponse<ApiResponse>,
  error: string | Error,
  statusCode = 500,
  code?: string
): void {
  const message = error instanceof Error ? error.message : error;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
  });
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(
  error: unknown,
  res: NextApiResponse<ApiResponse>,
  defaultMessage = 'An error occurred'
): void {
  if (error instanceof ApiError) {
    sendError(res, error.message, error.statusCode, error.code);
    return;
  }

  if (error instanceof Error) {
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : defaultMessage;
    
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    
    sendError(res, message, 500);
    return;
  }

  sendError(res, defaultMessage, 500);
}

/**
 * Validate HTTP method
 */
export function validateMethod(
  method: string,
  allowedMethods: string[]
): boolean {
  return allowedMethods.includes(method);
}

