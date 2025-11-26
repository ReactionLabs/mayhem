/**
 * User Database Operations
 * Functions to interact with user data in Supabase
 */

import { supabase } from '../supabase';
import type { User, Wallet } from '../supabase';

/**
 * Get user by Clerk user ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase not configured');
    }
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching user:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get user's primary wallet
 */
export async function getUserPrimaryWallet(userId: string): Promise<Wallet | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .single();

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching primary wallet:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get all wallets for a user
 */
export async function getUserWallets(userId: string): Promise<Wallet[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching wallets:', error);
    }
    return [];
  }

  return data || [];
}

