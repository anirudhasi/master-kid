// modules/identity/service/identity.ts — IdentityContract implementation (PR-6).
// can() gates UX only; RLS + /api checks are the real enforcement (M1 spec §3).

import { supabase } from '@/lib/supabase'
import { bus, makeEvent } from '@/modules/events'
import type { Action, IdentityContract, Resource, Role, Session } from '../contracts'
import type { AuthSession } from './authService'

// ── Pure policy matrix (M1 spec §3) — the ONLY place role logic lives ────────
// | role   | own account | own children | enrolled child | any account | platform |
// | parent | RW          | RW           | —              | —           | —        |
// | coach  | RW          | —            | R (+W own ms)  | —           | —        |
// | school | RW          | —            | R (rostered)   | —           | —        |
// | admin  | RW          | —            | —              | RW (server) | RW       |
// v1 is role-based; ownership/enrollment scoping is enforced by RLS.
export function isAllowed(roles: Role[], action: Action, resource: Resource): boolean {
  const has = (r: Role) => roles.includes(r)
  switch (resource.kind) {
    case 'child':
      // Multi-role (spec §2): parent rights win for one's own children even if
      // the account also holds admin. Pure admin reaches accounts via server fns only.
      if (has('parent')) return true            // own children (RLS scopes to own)
      if (has('coach') || has('school')) return action === 'read'
      return false
    case 'course':
      if (has('coach')) return true             // own courses (RLS scopes)
      return action === 'read'                  // parents/children browse
    case 'post':
      return has('admin') ? action === 'manage' || action === 'delete' : true // RLS + moderation
    case 'module':
      if (resource.name === 'admin') return has('admin')
      return true                                // module availability = M10 toggles, not roles
  }
}

const sha256Hex = async (text: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// 8-char code from an unambiguous alphabet (no 0/O/1/I) — shown to the parent ONCE.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function makeCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

async function currentSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data: u } = await supabase.auth.getUser()
  const user = u.user
  if (!user) return null
  const { data } = await supabase
    .from('accounts')
    .select('role, roles, name, email, phone')
    .eq('id', user.id)
    .single()
  const role = (data?.role ?? 'parent') as Role
  return {
    userId: user.id,
    role,
    roles: ((data?.roles ?? [role]) as Role[]),
    name: data?.name ?? undefined,
    email: data?.email ?? user.email ?? undefined,
    phone: data?.phone ?? user.phone ?? undefined,
  }
}

export const identity: IdentityContract = {
  getSession: currentSession,

  async can(action, resource) {
    const s = await currentSession()
    return s ? isAllowed(s.roles, action, resource) : false
  },

  async grantHandshake(childId, granteeRole = 'coach') {
    if (!supabase) throw new Error('Handshake needs the live backend.')
    const { data: u } = await supabase.auth.getUser()
    if (!u.user) throw new Error('Not signed in.')
    const token = makeCode()
    const token_hash = await sha256Hex(token)
    const expires_at = new Date(Date.now() + 72 * 3600_000).toISOString()
    const { error } = await supabase.from('handshake_tokens').insert({
      child_id: childId, granted_by: u.user.id, grantee_role: granteeRole, token_hash, expires_at,
    })
    if (error) throw new Error(`grant failed: ${error.message}`)
    bus.emit(makeEvent('handshake.granted', { childId, granteeRole }, u.user.id))
    return { token, expiresAt: expires_at }   // plaintext leaves here exactly once
  },

  async redeemHandshake(token) {
    if (!supabase) throw new Error('Handshake needs the live backend.')
    const p_token_hash = await sha256Hex(token.trim().toUpperCase())
    const { data, error } = await supabase.rpc('redeem_handshake', { p_token_hash })
    if (error) throw new Error(`redeem failed: ${error.message}`)
    const row = Array.isArray(data) ? data[0] : data
    if (!row?.ok) return { ok: false }
    const { data: u } = await supabase.auth.getUser()
    bus.emit(makeEvent('handshake.redeemed',
      { childId: row.child_id, granteeAccountId: u.user?.id ?? '' }, u.user?.id ?? null))
    return { ok: true, childId: row.child_id }
  },

  async revokeAccess(childId, granteeAccountId) {
    if (!supabase) throw new Error('Revoke needs the live backend.')
    // Kill the grant; the enrollment row is M4's to deactivate (Stage 3 PR-19).
    const { error } = await supabase
      .from('handshake_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('child_id', childId)
      .eq('redeemed_by', granteeAccountId)
      .is('revoked_at', null)
    if (error) throw new Error(`revoke failed: ${error.message}`)
    bus.emit(makeEvent('access.revoked', { childId, granteeAccountId }))
  },

  async setChildPin(pin) {
    if (!supabase) throw new Error('PIN needs the live backend.')
    const { error } = await supabase.rpc('set_child_pin', { p_pin: pin })
    if (error) throw new Error(`set pin failed: ${error.message}`)
  },

  async verifyChildPin(pin) {
    if (!supabase) return false
    const { data, error } = await supabase.rpc('verify_child_pin', { p_pin: pin })
    return !error && data === true
  },
}

/**
 * Write the login identity (email/phone/name) onto the caller's accounts row.
 * Fixes the "accounts row is all NULLs" gap: 001's trigger only copies phone at
 * signup, so email/Google logins left every identity field empty — which also
 * broke anything keyed on them. Detects first-session provisioning (row still
 * unsynced) and emits `account.created`.
 */
export async function syncAccountIdentity(session: AuthSession): Promise<void> {
  if (!supabase) return
  const { data: u } = await supabase.auth.getUser()
  const uid = u.user?.id
  if (!uid) return
  const { data: row } = await supabase
    .from('accounts').select('email, phone, name, role').eq('id', uid).single()
  if (!row) return
  const firstSession = !row.email && !row.phone && !row.name
  const patch: Record<string, string> = {}
  if (!row.email && session.email) patch.email = session.email
  if (!row.phone && session.phone) patch.phone = session.phone
  if (!row.name && session.name) patch.name = session.name
  if (Object.keys(patch).length > 0) {
    await supabase.from('accounts').update(patch).eq('id', uid)
  }
  if (firstSession) {
    bus.emit(makeEvent('account.created', { accountId: uid, role: row.role ?? 'parent' }, uid))
  }
}
