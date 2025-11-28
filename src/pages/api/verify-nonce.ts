import { NextApiRequest, NextApiResponse } from 'next';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { rateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/api/rate-limit';
import { safeLogError } from '@/lib/log-sanitizer';
import { nonceVerificationSchema, validateRequest } from '@/lib/api/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await rateLimit(identifier, rateLimitConfigs.general);
    
    if (!rateLimitResult.success) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      });
    }

    // Input validation
    const validation = validateRequest(nonceVerificationSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { publicKey, nonce, signature } = validation.data;

    // Reconstruct the message that was signed (must match exactly)
    const message = new TextEncoder().encode(
      `Sign this message to enable quick trading on Mayhem.\n\nNonce: ${nonce}\n\nThis signature will be valid for 24 hours.`
    );

    try {
      // Decode public key and signature
      const publicKeyBytes = bs58.decode(publicKey);
      const signatureBytes = bs58.decode(signature);

      // Verify ed25519 signature using tweetnacl
      const isValid = nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);

      if (!isValid) {
        return res.status(400).json({
          valid: false,
          error: 'Invalid signature',
          message: 'Signature verification failed. Please sign the message again.',
        });
      }

      // Verify public key format
      try {
        new PublicKey(publicKey);
      } catch {
        return res.status(400).json({
          valid: false,
          error: 'Invalid public key format',
        });
      }

      return res.status(200).json({
        valid: true,
        publicKey,
        message: 'Nonce signature verified. Quick trading enabled for 24 hours.',
      });
    } catch (error) {
      safeLogError('Nonce verification error', error);
      return res.status(500).json({
        error: 'Failed to verify nonce signature',
        valid: false,
      });
    }
  } catch (error) {
    safeLogError('Nonce verification error', error);
    return res.status(500).json({
      error: 'Failed to verify nonce signature',
      valid: false,
    });
  }
}

