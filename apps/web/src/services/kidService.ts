// ── Kid profile sync ─────────────────────────────────────────────────────────
// Fixes the "child created on one device isn't visible on another" bug: kid
// profiles are persisted to Supabase `public.children` (RLS: owner only) and
// re-hydrated on every login. localStorage remains the offline/mock fallback —
// all functions no-op gracefully when Supabase isn't configured.

import { supabase } from '@/lib/supabase'
import type { KidProfile } from '@/modules/identity'

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export const newKidId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`

async function userId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// Everything the normalized columns don't hold travels in the `profile` jsonb.
function toRow(kid: KidProfile, accountId: string) {
  const { id, name, grade, board, photoUrl, ...rest } = kid
  return {
    id,
    account_id: accountId,
    name,
    enrolled_grade: grade || 'Class 1',
    board: board || null,
    photo_url: photoUrl ?? null,
    is_active: true,
    profile: rest,
  }
}

function fromRow(row: any): KidProfile {
  const p = row.profile ?? {}
  return {
    id: row.id,
    name: row.name,
    grade: row.enrolled_grade ?? p.grade ?? '',
    board: row.board ?? p.board ?? 'CBSE',
    photoUrl: row.photo_url ?? undefined,
    age: p.age ?? 8,
    school: p.school ?? '',
    avatar: p.avatar ?? '🧒',
    color: p.color ?? '#6C63FF',
    colorLight: p.colorLight ?? '#EEECFF',
    xpTotal: p.xpTotal ?? 0,
    streakDays: p.streakDays ?? 0,
    isOnboarded: p.isOnboarded ?? false,
    onboarding: p.onboarding,
  }
}

export const kidService = {
  /** All children of the signed-in account, or null when no backend/session. */
  async fetchKids(): Promise<KidProfile[] | null> {
    if (!supabase) return null
    const uid = await userId()
    if (!uid) return null
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('account_id', uid)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    if (error) {
      console.warn('[kidService] fetch failed:', error.message)
      return null
    }
    return (data ?? []).map(fromRow)
  },

  /** Insert-or-update one kid. Fire-and-forget from the store. */
  async upsertKid(kid: KidProfile): Promise<void> {
    if (!supabase || !isUuid(kid.id)) return
    const uid = await userId()
    if (!uid) return
    const { error } = await supabase.from('children').upsert(toRow(kid, uid))
    if (error) console.warn('[kidService] upsert failed:', error.message)
  },

  async deleteKid(kidId: string): Promise<void> {
    if (!supabase || !isUuid(kidId)) return
    const uid = await userId()
    if (!uid) return
    const { error } = await supabase.from('children').delete().eq('id', kidId).eq('account_id', uid)
    if (error) console.warn('[kidService] delete failed:', error.message)
  },

  /** Keep the accounts row (name/role/avatar) current for this login. */
  async upsertAccount(patch: { name?: string; role?: string; avatarUrl?: string }): Promise<void> {
    if (!supabase) return
    const uid = await userId()
    if (!uid) return
    const { error } = await supabase.from('accounts').upsert({
      id: uid,
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.role !== undefined && { role: patch.role.toLowerCase() === 'coach' ? 'coach' : 'parent' }),
      ...(patch.avatarUrl !== undefined && { avatar_url: patch.avatarUrl }),
    })
    if (error) console.warn('[kidService] account upsert failed:', error.message)
  },
}

export { isUuid }
