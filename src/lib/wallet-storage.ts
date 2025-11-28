/**
 * Wallet Storage Utilities
 * Manages Lightning wallet data in localStorage with encryption
 */

import { encryptPrivateKey, decryptPrivateKey, encryptApiKey, decryptApiKey } from './browser-encryption';

export type StoredWallet = {
  publicKey: string;
  privateKey: string; // Encrypted when stored
  privateKeyEncrypted?: string; // Legacy support
  label: string;
  apiKey: string; // Encrypted when stored
  apiKeyEncrypted?: string; // Legacy support
  createdAt: string;
};

const STORAGE_KEY = 'mayhem_lightning_wallets';

/**
 * Get all stored wallets from localStorage and decrypt private keys
 */
export async function getStoredWallets(): Promise<StoredWallet[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const wallets: StoredWallet[] = JSON.parse(stored);
    
    // Decrypt private keys and API keys
    const decryptedWallets = await Promise.all(
      wallets.map(async (wallet) => {
        try {
          // Handle legacy encrypted format
          if (wallet.privateKeyEncrypted) {
            wallet.privateKey = await decryptPrivateKey(wallet.privateKeyEncrypted, wallet.publicKey);
            delete wallet.privateKeyEncrypted;
          } else if (wallet.privateKey && !wallet.privateKey.startsWith('[')) {
            // If it's not an array (encrypted), try to decrypt it
            try {
              wallet.privateKey = await decryptPrivateKey(wallet.privateKey, wallet.publicKey);
            } catch {
              // If decryption fails, assume it's already plaintext (legacy)
            }
          }

          // Handle legacy encrypted API key format
          if (wallet.apiKeyEncrypted) {
            wallet.apiKey = await decryptApiKey(wallet.apiKeyEncrypted, wallet.publicKey);
            delete wallet.apiKeyEncrypted;
          } else if (wallet.apiKey && wallet.apiKey.length > 50) {
            // If API key looks encrypted (long base64 string), try to decrypt
            try {
              wallet.apiKey = await decryptApiKey(wallet.apiKey, wallet.publicKey);
            } catch {
              // If decryption fails, assume it's already plaintext (legacy)
            }
          }

          return wallet;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`Failed to decrypt wallet ${wallet.publicKey}:`, error);
          }
          // Return wallet with encrypted data if decryption fails
          return wallet;
        }
      })
    );

    return decryptedWallets;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to read stored wallets:', error);
    }
    return [];
  }
}

/**
 * Save wallets to localStorage with encrypted private keys and API keys
 */
export async function saveStoredWallets(wallets: StoredWallet[]): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // Encrypt sensitive data before storing
    const encryptedWallets = await Promise.all(
      wallets.map(async (wallet) => {
        const encrypted: StoredWallet = { ...wallet };
        
        try {
          // Encrypt private key if not already encrypted
          if (wallet.privateKey && !wallet.privateKey.startsWith('[')) {
            encrypted.privateKey = await encryptPrivateKey(wallet.privateKey, wallet.publicKey);
          }

          // Encrypt API key if not already encrypted
          if (wallet.apiKey && wallet.apiKey.length < 50) {
            encrypted.apiKey = await encryptApiKey(wallet.apiKey, wallet.publicKey);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`Failed to encrypt wallet ${wallet.publicKey}:`, error);
          }
          // Store as-is if encryption fails (shouldn't happen)
        }

        return encrypted;
      })
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedWallets));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to save wallets:', error);
    }
  }
}

/**
 * Get API key for a specific wallet address
 */
export async function getApiKeyForWallet(publicKey: string): Promise<string | null> {
  const wallets = await getStoredWallets();
  const wallet = wallets.find((w) => w.publicKey.toLowerCase() === publicKey.toLowerCase());
  return wallet?.apiKey || null;
}

/**
 * Get the default/primary wallet (most recently created)
 */
export async function getDefaultWallet(): Promise<StoredWallet | null> {
  const wallets = await getStoredWallets();
  if (wallets.length === 0) return null;
  
  // Sort by createdAt descending and return the most recent
  return wallets.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

/**
 * Store a new wallet (with encryption)
 */
export async function storeWallet(wallet: Omit<StoredWallet, 'createdAt'>): Promise<StoredWallet> {
  const wallets = await getStoredWallets();
  const newWallet: StoredWallet = {
    ...wallet,
    createdAt: new Date().toISOString(),
  };
  wallets.push(newWallet);
  await saveStoredWallets(wallets);
  return newWallet;
}

/**
 * Get current active wallet (for Harry agent)
 */
export async function getCurrentWallet(): Promise<StoredWallet | null> {
  return getDefaultWallet();
}

/**
 * Set current wallet (for Harry agent)
 */
export function setCurrentWallet(publicKey: string): void {
  // For now, just use default wallet
  // Could implement a "current" flag in the future
}

