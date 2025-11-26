import crypto from 'crypto';

const ENC_KEY = process.env.WALLET_ENCRYPTION_KEY;

if (!ENC_KEY || ENC_KEY.length < 32) {
  throw new Error('WALLET_ENCRYPTION_KEY must be set to at least 32 characters.');
}

const KEY = crypto.createHash('sha256').update(ENC_KEY).digest();

export function encryptSecret(secret: string): { cipherText: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    cipherText: Buffer.concat([encrypted, authTag]).toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function decryptSecret(cipherText: string, iv: string): string {
  const data = Buffer.from(cipherText, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTag = data.slice(data.length - 16);
  const encrypted = data.slice(0, data.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, ivBuffer);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

