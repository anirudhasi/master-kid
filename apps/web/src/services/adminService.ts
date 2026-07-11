// adminService — the client seam to server-side admin (dev-spec PR-5, M1 spec §5).
//
// SECURITY: admin authority is decided by the SERVER, never the browser.
//  - isAdmin is read from the account's DB role (RLS: a user sees only their own
//    row). This gates UX only.
//  - Every privileged mutation goes through POST /api/admin, which re-verifies the
//    caller's JWT + role='admin' server-side and runs with the service-role key.
// The old client-side password hash (src/lib/adminAuth.ts) is gone — it shipped a
// secret in the bundle.

import { supabase } from '@/lib/supabase'

/** True only if the signed-in account is an active admin (server data, RLS-scoped). */
export async function fetchIsAdmin(): Promise<boolean> {
  if (!supabase) return false
  const { data: u } = await supabase.auth.getUser()
  const uid = u.user?.id
  if (!uid) return false
  const { data, error } = await supabase
    .from('accounts')
    .select('role, roles, status')
    .eq('id', uid)
    .single()
  if (error || !data) return false
  return data.status === 'active' &&
    (data.role === 'admin' || (data.roles ?? []).includes('admin'))
}

export type AdminAction = 'set_account_status' | 'set_account_role' | 'search_accounts'

/** Call the server admin gateway with the caller's Supabase access token. */
export async function callAdmin<T = unknown>(
  action: AdminAction,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (!supabase) throw new Error('Admin actions require the live backend.')
  const { data: s } = await supabase.auth.getSession()
  const token = s.session?.access_token
  if (!token) throw new Error('Not signed in.')
  // Route is /api/mk-admin (NOT /api/admin): Azure Functions reserves the
  // 'admin' route for its own host administration API — a function routed
  // there silently 404s.
  const res = await fetch('/api/mk-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, params }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `admin ${action} failed (${res.status})`)
  return body.data as T
}
