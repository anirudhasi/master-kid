// M1 identity tests (dev-spec PR-6): policy matrix + handshake round-trip.
// Supabase is mocked — the round-trip proves our grant/redeem logic (code
// generation, hashing, single-use semantics, bus events), while RLS/RPC
// behavior is enforced by migration 012 on the real database.
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock: in-memory handshake_tokens + redeem_handshake RPC ─────────
type TokenRow = {
  child_id: string; granted_by: string; grantee_role: string
  token_hash: string; expires_at: string
  redeemed_by?: string | null; redeemed_at?: string | null; revoked_at?: string | null
}
const db: { tokens: TokenRow[] } = { tokens: [] }
const UID = 'parent-uid-1'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: UID } } }) },
    from: (table: string) => ({
      insert: async (row: TokenRow) => {
        if (table !== 'handshake_tokens') throw new Error(`unexpected table ${table}`)
        db.tokens.push({ ...row, redeemed_at: null, revoked_at: null })
        return { error: null }
      },
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
      update: (patch: Partial<TokenRow>) => {
        const chain = {
          _filters: [] as Array<(t: TokenRow) => boolean>,
          eq(col: string, val: string) {
            this._filters.push((t) => (t as unknown as Record<string, unknown>)[col] === val)
            return this
          },
          is(col: string, val: null) {
            this._filters.push((t) => (t as unknown as Record<string, unknown>)[col] === val)
            return this
          },
          then(resolve: (v: { error: null }) => void) {
            db.tokens.filter((t) => chain._filters.every((f) => f(t)))
              .forEach((t) => Object.assign(t, patch))
            resolve({ error: null })
          },
        }
        return chain
      },
    }),
    rpc: async (fn: string, args: { p_token_hash: string }) => {
      if (fn !== 'redeem_handshake') throw new Error(`unexpected rpc ${fn}`)
      const t = db.tokens.find((x) =>
        x.token_hash === args.p_token_hash && !x.redeemed_at && !x.revoked_at &&
        new Date(x.expires_at) > new Date())
      if (!t) return { data: [{ ok: false, child_id: null }], error: null }
      t.redeemed_by = UID
      t.redeemed_at = new Date().toISOString()
      return { data: [{ ok: true, child_id: t.child_id }], error: null }
    },
  },
}))

import { identity, isAllowed } from './identity'
import { bus } from '@/modules/events'

const flush = () => new Promise<void>((r) => setTimeout(r, 0))

beforeEach(() => { db.tokens = [] })

describe('M1 policy matrix (isAllowed)', () => {
  it('parent: RW own children; no platform config', () => {
    expect(isAllowed(['parent'], 'update', { kind: 'child', childId: 'c1' })).toBe(true)
    expect(isAllowed(['parent'], 'manage', { kind: 'module', name: 'admin' })).toBe(false)
  })
  it('coach: read-only on child; RW own courses', () => {
    expect(isAllowed(['coach'], 'read',   { kind: 'child', childId: 'c1' })).toBe(true)
    expect(isAllowed(['coach'], 'update', { kind: 'child', childId: 'c1' })).toBe(false)
    expect(isAllowed(['coach'], 'update', { kind: 'course', courseId: 'k1' })).toBe(true)
  })
  it('admin: platform config yes; child data no (server fns only)', () => {
    expect(isAllowed(['admin'], 'manage', { kind: 'module', name: 'admin' })).toBe(true)
    expect(isAllowed(['admin'], 'read',   { kind: 'child', childId: 'c1' })).toBe(false)
  })
  it('multi-role parent+admin keeps parent rights on children', () => {
    expect(isAllowed(['parent', 'admin'], 'read', { kind: 'child', childId: 'c1' })).toBe(true)
    expect(isAllowed(['parent', 'admin'], 'manage', { kind: 'module', name: 'admin' })).toBe(true)
  })
})

describe('handshake round-trip (grant → redeem, single-use)', () => {
  it('grants an 8-char code, stores only its hash, redeems once', async () => {
    const { token, expiresAt } = await identity.grantHandshake('child-1', 'coach')
    expect(token).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)         // unambiguous alphabet
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now())
    expect(db.tokens).toHaveLength(1)
    expect(db.tokens[0].token_hash).not.toContain(token)  // plaintext never stored

    const first = await identity.redeemHandshake(token)
    expect(first).toEqual({ ok: true, childId: 'child-1' })

    const second = await identity.redeemHandshake(token)  // single-use enforced
    expect(second).toEqual({ ok: false })
  })

  it('redeem is case/whitespace tolerant (parents dictate codes aloud)', async () => {
    const { token } = await identity.grantHandshake('child-2', 'coach')
    const res = await identity.redeemHandshake(`  ${token.toLowerCase()}  `)
    expect(res.ok).toBe(true)
  })

  it('rejects an expired token', async () => {
    const { token } = await identity.grantHandshake('child-3', 'school')
    db.tokens[0].expires_at = new Date(Date.now() - 1000).toISOString()
    expect((await identity.redeemHandshake(token)).ok).toBe(false)
  })

  it('emits handshake.granted and handshake.redeemed on the bus', async () => {
    const before = bus.getLedger().length
    const { token } = await identity.grantHandshake('child-4', 'coach')
    await identity.redeemHandshake(token)
    await flush()
    const types = bus.getLedger().slice(before).map((e) => e.type)
    expect(types).toContain('handshake.granted')
    expect(types).toContain('handshake.redeemed')
  })

  it('revokeAccess kills a redeemed grant and emits access.revoked', async () => {
    const { token } = await identity.grantHandshake('child-5', 'coach')
    await identity.redeemHandshake(token)
    await identity.revokeAccess('child-5', UID)
    expect(db.tokens[0].revoked_at).toBeTruthy()
    await flush()
    expect(bus.getLedger().some((e) => e.type === 'access.revoked')).toBe(true)
  })
})
