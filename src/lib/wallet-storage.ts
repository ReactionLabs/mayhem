/**
 * Wallet Storage Utilities
 * Manages Lightning wallet data in localStorage
 */

export type StoredWallet = {
  publicKey: string;
  privateKey: string;
  label: string;
  apiKey: string;
  createdAt: string;
};

const STORAGE_KEY = 'mayhem_lightning_wallets';

/**
 * Get all stored wallets from localStorage
 */
export function getStoredWallets(): StoredWallet[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to read stored wallets:', error);
    }
    return [];
  }
}

/**
 * Save wallets to localStorage
 */
export function saveStoredWallets(wallets: StoredWallet[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to save wallets:', error);
    }
  }
}

/**
 * Get API key for a specific wallet address
 */
export function getApiKeyForWallet(publicKey: string): string | null {
  const wallets = getStoredWallets();
  const wallet = wallets.find((w) => w.publicKey.toLowerCase() === publicKey.toLowerCase());
  return wallet?.apiKey || null;
}

/**
 * Get the default/primary wallet (most recently created)
 */
export function getDefaultWallet(): StoredWallet | null {
  const wallets = getStoredWallets();
  if (wallets.length === 0) return null;
  
  // Sort by createdAt descending and return the most recent
  return wallets.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

