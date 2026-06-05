import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// We use CRM_CREDENTIALS_ENCRYPTION_KEY (32 bytes hex) or fallback to PAYMENTS_ENCRYPTION_KEY
function getEncryptionKey(): Buffer {
  const keyHex = process.env.CRM_CREDENTIALS_ENCRYPTION_KEY || process.env.PAYMENTS_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('Encryption key not configured (CRM_CREDENTIALS_ENCRYPTION_KEY)');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }
  return key;
}

export function hasEncryptionKey(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch (e) {
    return false;
  }
}

export function encryptData(data: string): { encryptedData: string; iv: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encryptedData,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decryptData(encryptedData: string, ivHex: string, authTagHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
