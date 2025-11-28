/**
 * Log Sanitization Utilities
 * Removes sensitive data from logs before output
 */

/**
 * Sanitize an object by removing sensitive fields
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'privateKey',
    'private_key',
    'secretKey',
    'secret_key',
    'apiKey',
    'api_key',
    'password',
    'token',
    'authorization',
    'auth',
    'signature',
    'nonce',
    'encrypted',
    'decrypted',
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize error objects for logging
 */
export function sanitizeError(error: any): any {
  if (!error) return error;

  const sanitized: any = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
  };

  // Only include stack in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    sanitized.stack = error.stack;
  }

  // Sanitize any additional properties
  const rest = { ...error };
  delete rest.message;
  delete rest.name;
  delete rest.stack;

  return {
    ...sanitized,
    ...sanitizeForLogging(rest),
  };
}

/**
 * Safe console.error that sanitizes data
 */
export function safeLogError(message: string, error?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error ? sanitizeError(error) : '');
  }
  // In production, send to error tracking service instead
}

/**
 * Safe console.log that sanitizes data
 */
export function safeLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data ? sanitizeForLogging(data) : '');
  }
}


