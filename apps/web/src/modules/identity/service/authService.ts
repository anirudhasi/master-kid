// ── Auth service boundary ───────────────────────────────────────────────────
// The UI and store talk ONLY to this interface, never to Supabase directly.
// This is the seam that lets us scale the backend (or swap providers) to
// millions of users without touching the UI.
//
//   • supabaseAuthService — production: real phone OTP + JWT session.
//   • mockAuthService      — zero-config fallback for local/beta (in-browser OTP).
//
// Selected automatically from env (AUTH_PROVIDER).

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER, DEFAULT_COUNTRY_CODE } from '@/lib/env'

export interface OtpRequestResult {
  ok: boolean
  /** Only set in mock mode — the code to show on screen. Undefined for real SMS. */
  devOtp?: string
  error?: string
}
export interface OtpVerifyResult {
  ok: boolean
  userId?: string
  error?: string
}
export interface AuthSession {
  userId: string
  /** Login identifier: email (preferred) or 10-digit phone. */
  phone: string
  email?: string
  name?: string
  avatarUrl?: string
}

export interface AuthService {
  requestOtp(phone10: string): Promise<OtpRequestResult>
  verifyOtp(phone10: string, code: string): Promise<OtpVerifyResult>
  /** Redirect-based Google OAuth sign-in (no email/SMTP needed). */
  signInWithGoogle(): Promise<{ ok: boolean; error?: string }>
  getSession(): Promise<AuthSession | null>
  signOut(): Promise<void>
  /** Subscribe to session changes; returns an unsubscribe fn. */
  onChange(cb: (session: AuthSession | null) => void): () => void
}

const to10 = (raw: string) => raw.replace(/\D/g, '').slice(-10)
const toE164 = (raw: string) =>
  raw.startsWith('+') ? raw : `${DEFAULT_COUNTRY_CODE}${to10(raw)}`
const isEmail = (s: string) => s.includes('@')
/** Normalize an identifier: lower-cased email, or last-10-digit phone. */
const normId = (raw: string) => isEmail(raw) ? raw.trim().toLowerCase() : to10(raw)

/** Map a Supabase auth user to our AuthSession (email + Google profile metadata). */
function sessionFrom(u: { id: string; email?: string | null; phone?: string | null; user_metadata?: Record<string, any> } | null | undefined): AuthSession | null {
  if (!u) return null
  const meta = u.user_metadata ?? {}
  return {
    userId: u.id,
    phone: u.email ? String(u.email).toLowerCase() : to10(u.phone ?? ''),
    email: u.email ?? undefined,
    name: meta.full_name ?? meta.name ?? undefined,
    avatarUrl: meta.avatar_url ?? meta.picture ?? undefined,
  }
}

// ── Mock provider (no backend) ───────────────────────────────────────────────
const pendingOtp = new Map<string, string>()

const mockAuthService: AuthService = {
  async requestOtp(identifier) {
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    pendingOtp.set(normId(identifier), otp)
    return { ok: true, devOtp: otp }
  },
  async verifyOtp(identifier, code) {
    const key = normId(identifier)
    const expected = pendingOtp.get(key)
    if (code === expected || code === '000000') {
      pendingOtp.delete(key)
      return { ok: true, userId: `mock:${key}` }
    }
    return { ok: false, error: 'Incorrect code' }
  },
  async signInWithGoogle() {
    return { ok: false, error: 'Google sign-in needs the live backend (Supabase).' }
  },
  // Mock session is owned by the persisted Zustand store, not here.
  async getSession() {
    return null
  },
  async signOut() {
    /* no-op — store handles local logout */
  },
  onChange() {
    return () => {}
  },
}

// ── Supabase provider (production) ───────────────────────────────────────────
// Requires a phone/SMS provider configured in the Supabase Auth dashboard
// (e.g. MSG91/Twilio). Until then, AUTH_PROVIDER stays 'mock' automatically.
const supabaseAuthService: AuthService = {
  async requestOtp(identifier) {
    if (!supabase) return { ok: false, error: 'Auth backend not configured' }
    const { error } = isEmail(identifier)
      ? await supabase.auth.signInWithOtp({ email: identifier.trim().toLowerCase() })
      : await supabase.auth.signInWithOtp({ phone: toE164(identifier) })
    return error ? { ok: false, error: error.message } : { ok: true }
  },
  async verifyOtp(identifier, code) {
    if (!supabase) return { ok: false, error: 'Auth backend not configured' }
    const { data, error } = isEmail(identifier)
      ? await supabase.auth.verifyOtp({ email: identifier.trim().toLowerCase(), token: code, type: 'email' })
      : await supabase.auth.verifyOtp({ phone: toE164(identifier), token: code, type: 'sms' })
    if (error) return { ok: false, error: error.message }
    return { ok: true, userId: data.user?.id }
  },
  async signInWithGoogle() {
    if (!supabase) return { ok: false, error: 'Auth backend not configured' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login' },
    })
    return error ? { ok: false, error: error.message } : { ok: true }
  },
  async getSession() {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return sessionFrom(data.session?.user)
  },
  async signOut() {
    await supabase?.auth.signOut()
  },
  onChange(cb) {
    if (!supabase) return () => {}
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(sessionFrom(session?.user))
    })
    return () => data.subscription.unsubscribe()
  },
}

export const authService: AuthService =
  AUTH_PROVIDER === 'supabase' ? supabaseAuthService : mockAuthService

export const isMockAuth = AUTH_PROVIDER !== 'supabase'
