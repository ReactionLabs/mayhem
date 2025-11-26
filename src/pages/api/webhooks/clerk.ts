/**
 * Clerk Webhook Handler
 * Automatically generates a PumpPortal wallet when a user signs up
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';

// Simple encryption for private keys (in production, use proper encryption)
function encryptPrivateKey(privateKey: string): string {
  // Mock encryption - in production, use a proper encryption library
  return Buffer.from(privateKey).toString('base64');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      console.error('CLERK_WEBHOOK_SECRET is not set');
    }
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Get the Svix headers for verification
  const headerPayload = req.headers;
  const svix_id = headerPayload['svix-id'] as string;
  const svix_timestamp = headerPayload['svix-timestamp'] as string;
  const svix_signature = headerPayload['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Get the raw body
  const payload = JSON.stringify(req.body);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Webhook verification failed:', err);
    }
    return res.status(400).json({ error: 'Verification failed' });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, username } = evt.data;

    try {
      // 1. Create user in database
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: id,
          email: email_addresses?.[0]?.email_address || null,
          username: username || null,
        })
        .select()
        .single();

      if (userError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating user:', userError);
        }
        throw userError;
      }

      // 2. Generate wallet via PumpPortal API
      const walletResponse = await fetch('https://pumpportal.fun/api/create-wallet', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!walletResponse.ok) {
        throw new Error(`Failed to create wallet: ${walletResponse.status}`);
      }

      const walletData = await walletResponse.json();

      if (!walletData.publicKey || !walletData.privateKey || !walletData.apiKey) {
        throw new Error('Invalid wallet data received from PumpPortal');
      }

      // 3. Store wallet in database
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          public_key: walletData.publicKey,
          private_key_encrypted: encryptPrivateKey(walletData.privateKey),
          api_key: walletData.apiKey,
          is_primary: true,
          label: 'Main Wallet',
        });

      if (walletError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating wallet:', walletError);
        }
        throw walletError;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Created wallet for user ${id}`);
      }

      return res.status(200).json({ success: true, message: 'User and wallet created' });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Webhook processing error:', error);
      }
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      });
    }
  }

  // Handle other event types if needed
  return res.status(200).json({ received: true });
}

