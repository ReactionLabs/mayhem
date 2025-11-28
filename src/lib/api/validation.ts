/**
 * API Input Validation Schemas
 * Using Zod for type-safe validation
 */

import { z } from 'zod';

/**
 * Solana address validation
 */
const solanaAddressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
  message: 'Invalid Solana address format',
});

/**
 * Trade request validation
 */
export const tradeRequestSchema = z.object({
  action: z.enum(['buy', 'sell'], {
    errorMap: () => ({ message: 'Action must be "buy" or "sell"' }),
  }),
  mint: solanaAddressSchema,
  amount: z.number().positive().max(1000, {
    message: 'Amount cannot exceed 1000 SOL',
  }),
  denominatedInSol: z.boolean().optional().default(true),
  slippage: z.number().min(0).max(50, {
    message: 'Slippage must be between 0 and 50%',
  }).optional().default(10),
  priorityFee: z.number().min(0).max(0.01, {
    message: 'Priority fee cannot exceed 0.01 SOL',
  }).optional().default(0.0005),
  pool: z.string().optional().default('pump'),
});

/**
 * Token creation request validation
 */
export const tokenCreationSchema = z.object({
  tokenName: z.string().min(1).max(50, {
    message: 'Token name must be between 1 and 50 characters',
  }),
  tokenSymbol: z.string().min(1).max(10, {
    message: 'Token symbol must be between 1 and 10 characters',
  }),
  description: z.string().max(500, {
    message: 'Description cannot exceed 500 characters',
  }).optional(),
  initialBuyAmount: z.number().min(0).max(100, {
    message: 'Initial buy amount cannot exceed 100 SOL',
  }).optional().default(0.1),
});

/**
 * Wallet generation validation
 */
export const walletRequestSchema = z.object({
  label: z.string().max(100).optional(),
});

/**
 * Nonce verification validation
 */
export const nonceVerificationSchema = z.object({
  publicKey: solanaAddressSchema,
  nonce: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * Token search validation
 */
export const tokenSearchSchema = z.object({
  q: z.string().min(1).max(100),
});

/**
 * Generic validation helper
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}


