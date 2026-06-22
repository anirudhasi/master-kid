import { ADMIN_PHONE, ADMIN_PASSWORD_HASH } from './env'

// Admin credential check. Phone identifies the admin; the password is verified
// against a SHA-256 hash via Web Crypto (plaintext never stored/compared).

const to10 = (raw: string) => raw.replace(/\D/g, '').slice(-10)

export function isAdminPhone(phone: string): boolean {
  return Boolean(ADMIN_PHONE) && to10(phone) === to10(ADMIN_PHONE as string)
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyAdmin(phone: string, password: string): Promise<boolean> {
  if (!isAdminPhone(phone) || !ADMIN_PASSWORD_HASH) return false
  return (await sha256(password)) === (ADMIN_PASSWORD_HASH as string).toLowerCase()
}
