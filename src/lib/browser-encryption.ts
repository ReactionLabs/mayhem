/**
 * Browser-Compatible Encryption Utilities
 * Uses Web Crypto API for client-side encryption
 * For server-side encryption, use src/lib/encryption.ts
 */

/**
 * Derive encryption key from a passphrase
 * Uses PBKDF2 to derive a 256-bit key
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Encrypt data using AES-GCM
 * Returns base64-encoded string with format: salt:iv:ciphertext:authTag
 */
export async function encryptData(data: string, passphrase: string): Promise<string> {
  const salt = generateSalt();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(passphrase, salt);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  );

  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data encrypted with encryptData
 */
export async function decryptData(encryptedData: string, passphrase: string): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveKey(passphrase, salt);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt data. Invalid passphrase or corrupted data.');
  }
}

/**
 * Get encryption passphrase from localStorage or generate one
 * Uses wallet address as part of the key derivation for additional security
 */
function getEncryptionPassphrase(walletAddress?: string): string {
  if (typeof window === 'undefined') {
    throw new Error('Encryption passphrase can only be accessed in browser');
  }

  const STORAGE_KEY = 'mayhem_encryption_passphrase';
  
  // Try to get existing passphrase
  let passphrase = localStorage.getItem(STORAGE_KEY);
  
  if (!passphrase) {
    // Generate a new passphrase (32 random bytes as base64)
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    passphrase = btoa(String.fromCharCode(...randomBytes));
    localStorage.setItem(STORAGE_KEY, passphrase);
  }

  // Combine with wallet address if provided for additional security
  if (walletAddress) {
    return `${passphrase}:${walletAddress}`;
  }

  return passphrase;
}

/**
 * Encrypt private key for storage
 */
export async function encryptPrivateKey(privateKey: string, walletAddress?: string): Promise<string> {
  const passphrase = getEncryptionPassphrase(walletAddress);
  return encryptData(privateKey, passphrase);
}

/**
 * Decrypt private key from storage
 */
export async function decryptPrivateKey(encryptedPrivateKey: string, walletAddress?: string): Promise<string> {
  const passphrase = getEncryptionPassphrase(walletAddress);
  return decryptData(encryptedPrivateKey, passphrase);
}

/**
 * Encrypt API key for storage
 */
export async function encryptApiKey(apiKey: string, walletAddress?: string): Promise<string> {
  const passphrase = getEncryptionPassphrase(walletAddress);
  return encryptData(apiKey, passphrase);
}

/**
 * Decrypt API key from storage
 */
export async function decryptApiKey(encryptedApiKey: string, walletAddress?: string): Promise<string> {
  const passphrase = getEncryptionPassphrase(walletAddress);
  return decryptData(encryptedApiKey, passphrase);
}

