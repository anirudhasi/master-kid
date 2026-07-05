// modules/identity/contracts.ts — M1 Identity & Access (spec §3)
// Interface + policy types. Implementation lands in PR-6 (dev spec).
// REMINDER: can() gates UX only. RLS + /api checks are the real enforcement.

export type Role = 'parent' | 'coach' | 'school' | 'admin'
export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage'

export type ModuleName =
  | 'parent' | 'child' | 'coach' | 'school' | 'discovery' | 'community'
  | 'learning-content' | 'commerce' | 'admin' | 'customer-service' | 'notifications'

export type Resource =
  | { kind: 'child'; childId: string }
  | { kind: 'course'; courseId: string }
  | { kind: 'post'; postId: string }
  | { kind: 'module'; name: ModuleName }

export interface Session {
  userId: string
  role: Role            // primary
  roles: Role[]         // all granted (multi-role, spec §2)
  name?: string
  email?: string
  phone?: string
  avatarUrl?: string
}

export interface IdentityContract {
  getSession(): Promise<Session | null>
  /** Central RBAC check — the ONLY place role logic lives (spec §3). */
  can(action: Action, resource: Resource): Promise<boolean>
  /** Parent grants a coach/school access to a child. Returns the 8-char code once. */
  grantHandshake(childId: string, granteeRole: 'coach' | 'school'):
    Promise<{ token: string; expiresAt: string }>
  redeemHandshake(token: string): Promise<{ ok: boolean; childId?: string }>
  revokeAccess(childId: string, granteeAccountId: string): Promise<void>
  /** Child-mode PIN (spec §4). */
  setChildPin(pin: string): Promise<void>
  verifyChildPin(pin: string): Promise<boolean>
}

// PR-6 implements this over the existing authService provider seam + Supabase RPCs
// (redeem_handshake, set_child_pin, verify_child_pin from migration 012).
