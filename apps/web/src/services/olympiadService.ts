// ── Olympiad service boundary ────────────────────────────────────────────────
// UI talks only to this. Mock (write-through to olympiadStore) + supabase impls.
// Per-set progress maps to olympiad_progress; uploaded sets/community sharing
// map to user_resources (backend wiring deferred — client cache for now).

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER } from '@/lib/env'
import { useOlympiadStore, olyKey, type SetProgress } from '@/store/olympiadStore'
import type { OlySet } from '@/data/olympiadCatalog'

export interface OlympiadService {
  setProgress(childId: string, setId: string, status: SetProgress['status'], score?: number): Promise<void>
  addSet(grade: string, subject: string, set: OlySet): Promise<void>
  removeSet(grade: string, subject: string, setId: string): Promise<void>
  toggleShare(grade: string, subject: string, setId: string): Promise<void>
}

const store = () => useOlympiadStore.getState()
const customList = (grade: string, subject: string) => store().custom[olyKey(grade, subject)] ?? []

const base: OlympiadService = {
  async setProgress(childId, setId, status, score) {
    store()._setProgress(childId, setId, { status, score, updatedAt: Date.now() })
  },
  async addSet(grade, subject, set) {
    store()._setCustom(olyKey(grade, subject), [...customList(grade, subject), { ...set, source: 'custom' }])
  },
  async removeSet(grade, subject, setId) {
    store()._setCustom(olyKey(grade, subject), customList(grade, subject).filter((s) => s.id !== setId))
  },
  async toggleShare(grade, subject, setId) {
    store()._setCustom(olyKey(grade, subject), customList(grade, subject).map((s) => s.id === setId ? { ...s, shared: !s.shared } : s))
  },
}

// Supabase persists progress to olympiad_progress; uploaded sets stay client-side
// for now (a Storage-backed resource pipeline is a later step).
const supabaseOlympiadService: OlympiadService = {
  ...base,
  async setProgress(childId, setId, status, score) {
    await base.setProgress(childId, setId, status, score)
    if (!supabase) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('olympiad_progress').upsert({
      account_id: u.user?.id, child_id: childId, set_id: setId, status, score, updated_at: new Date().toISOString(),
    })
  },
}

export const olympiadService: OlympiadService =
  AUTH_PROVIDER === 'supabase' ? supabaseOlympiadService : base
