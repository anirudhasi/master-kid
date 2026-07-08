// Central, typed access to build-time env + feature flags.
// Vite exposes only vars prefixed with VITE_ to the client bundle.
// NOTE: the anon key is safe to ship to the browser (it is RLS-gated).
//       Service-role / payment / AI secrets live ONLY in SWA Functions.

const env = import.meta.env as Record<string, string | undefined>

export const SUPABASE_URL = env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY

/** True once a real Supabase project is configured. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/**
 * Auth backend. Defaults to 'supabase' when keys are present, otherwise falls
 * back to the in-browser 'mock' provider so the app runs with zero config.
 * Force a provider with VITE_AUTH_PROVIDER=supabase|mock.
 */
export const AUTH_PROVIDER: 'supabase' | 'mock' =
  env.VITE_AUTH_PROVIDER === 'supabase' || env.VITE_AUTH_PROVIDER === 'mock'
    ? (env.VITE_AUTH_PROVIDER as 'supabase' | 'mock')
    : hasSupabase
      ? 'supabase'
      : 'mock'

/**
 * Test-only bypass for the per-child subscription/payment step
 * (the "skip / pass" button from the Change Request). Enabled by default;
 * set VITE_PAYMENTS_TEST_SKIP=false to hide it (do this for production).
 */
export const PAYMENTS_TEST_SKIP = env.VITE_PAYMENTS_TEST_SKIP !== 'false'

/** Default country code for phone OTP (India-first). */
export const DEFAULT_COUNTRY_CODE = '+91'

/**
 * Login identifier. 'email' uses free/instant email OTP (no SMS provider needed);
 * 'phone' uses SMS OTP (needs Twilio/MSG91). Defaults to 'email'.
 * Override with VITE_LOGIN_METHOD=phone.
 */
export const LOGIN_METHOD: 'email' | 'phone' =
  env.VITE_LOGIN_METHOD === 'phone' ? 'phone' : 'email'

// Platform-admin is now decided SERVER-SIDE (dev-spec PR-5): an account whose DB
// role is 'admin', verified by POST /api/admin, gated in UI via
// services/adminService.fetchIsAdmin(). The old VITE_ADMIN_* client hash was a
// bundle-embedded secret and has been removed.
