/**
 * Encryption Utilities for Sensitive Data
 * Uses AES-256-GCM for encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHmac } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

// Get encryption key from environment
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  // Derive a 32-byte key from the provided key using scrypt
  return scryptSync(key, 'pharmalink-salt', 32)
}

/**
 * Encrypt a string value
 * Returns base64 encoded: salt + iv + authTag + encryptedData
 */
export function encrypt(text: string): string {
  if (!text) return ''
  
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const salt = randomBytes(SALT_LENGTH)
  
  // Derive key with salt for additional security
  const derivedKey = scryptSync(key, salt, 32)
  
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Combine: salt + iv + authTag + encrypted (all as base64)
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'base64')
  ])
  
  return combined.toString('base64')
}

/**
 * Decrypt a string value
 * Expects base64 encoded: salt + iv + authTag + encryptedData
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return ''
  
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedData, 'base64')
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    )
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
    
    // Derive key with salt
    const derivedKey = scryptSync(key, salt, 32)
    
    const decipher = createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hash a value using SHA-256 (for non-sensitive unique identifiers)
 */
export function hashValue(value: string): string {
  const key = getEncryptionKey()
  const derivedKey = scryptSync(key, 'hash-salt', 32)
  return createHmac('sha256', derivedKey).update(value).digest('hex')
}

/**
 * Mask sensitive data for display (e.g., phone numbers)
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-4)
}

/**
 * Mask email for display
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  const maskedLocal = local.slice(0, 2) + '***'
  return `${maskedLocal}@${domain}`
}
