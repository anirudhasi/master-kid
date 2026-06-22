// ── Activity / extra-curricular service boundary ─────────────────────────────
// UI talks only to this. Mock (write-through to activityStore) + supabase impls.
// Maps to custom_curricula + enrollments (handshake). The real coach side of the
// handshake is wired in the Coach module.

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER } from '@/lib/env'
import { useActivityStore, makeToken, type Activity } from '@/store/activityStore'
import { coachService } from '@/services/coachService'

export type NewActivity = Omit<Activity, 'id' | 'createdAt' | 'coachStatus'>

export interface LinkResult { ok: boolean; error?: string }

export interface ActivityService {
  add(a: NewActivity): Promise<Activity>
  update(id: string, patch: Partial<Activity>): Promise<void>
  remove(id: string): Promise<void>
  /** Parent generates a token to hand to a coach (status → pending). */
  inviteCoach(id: string): Promise<string>
  /** Parent enters a coach's join code → redeems it into a real enrollment. */
  linkCoach(id: string, code: string, child: { childId: string; childName: string; parentId: string; parentName: string }): Promise<LinkResult>
  unlinkCoach(id: string): Promise<void>
}

const store = () => useActivityStore.getState()

const base: ActivityService = {
  async add(a) {
    const full: Activity = { ...a, id: `act-${Date.now()}`, createdAt: Date.now(), coachStatus: 'none' }
    store()._set(full)
    return full
  },
  async update(id, patch) {
    const cur = store().activities[id]; if (cur) store()._set({ ...cur, ...patch })
  },
  async remove(id) { store()._remove(id) },
  async inviteCoach(id) {
    const cur = store().activities[id]
    const token = cur?.coachToken ?? makeToken()
    if (cur) store()._set({ ...cur, coachToken: token, coachStatus: 'pending' })
    return token
  },
  async linkCoach(id, code, child) {
    const cur = store().activities[id]
    if (!cur) return { ok: false, error: 'Activity not found' }
    const res = await coachService.redeem(code, child)
    if (!res.ok) return { ok: false, error: res.error }
    store()._set({ ...cur, coachToken: code.trim().toUpperCase(), coachStatus: 'linked', coachName: res.coachName, enrollmentId: res.enrollmentId })
    return { ok: true }
  },
  async unlinkCoach(id) {
    const cur = store().activities[id]
    if (cur) store()._set({ ...cur, coachStatus: 'none', coachToken: undefined, coachName: undefined, enrollmentId: undefined })
  },
}

// Supabase mirrors the curriculum + handshake to Postgres; cache stays the
// reactive source of truth. Full coach acceptance lands in the Coach module.
const supabaseActivityService: ActivityService = {
  ...base,
  async add(a) {
    const full = await base.add(a)
    if (supabase) {
      const { data: u } = await supabase.auth.getUser()
      await supabase.from('custom_curricula').insert({
        account_id: u.user?.id, child_id: a.childId, set_by: 'parent',
        title: a.name, syllabus_md: a.curriculum, target_date: a.targetDate || null,
      })
    }
    return full
  },
}

export const activityService: ActivityService =
  AUTH_PROVIDER === 'supabase' ? supabaseActivityService : base
