// ── Storyboard service boundary ──────────────────────────────────────────────
// UI talks only to this. Mock (write-through to storyboardStore) + Supabase
// impls, selected by AUTH_PROVIDER — same pattern as auth/subscription services.

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER } from '@/lib/env'
import {
  useStoryboardStore,
  photoCountFor,
  PHOTO_CAP,
  type StoryEntry,
} from '@/store/storyboardStore'

export type NewEntry = Omit<StoryEntry, 'id' | 'createdAt'>

export interface StoryboardService {
  list(childId: string): Promise<StoryEntry[]>
  add(entry: NewEntry): Promise<StoryEntry>
  update(id: string, patch: Partial<StoryEntry>): Promise<void>
  remove(id: string): Promise<void>
}

const store = () => useStoryboardStore.getState()

function assertPhotoCap(entry: NewEntry) {
  if (entry.kind !== 'photo') return
  if (photoCountFor(store().entries, entry.childId, entry.grade) >= PHOTO_CAP) {
    throw new Error(`Photo limit reached (max ${PHOTO_CAP} per class)`)
  }
}

// ── Mock provider ─────────────────────────────────────────────────────────────
const mockStoryboardService: StoryboardService = {
  async list(childId) {
    return Object.values(store().entries).filter((e) => e.childId === childId)
  },
  async add(entry) {
    assertPhotoCap(entry)
    const full: StoryEntry = { ...entry, id: `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now() }
    store()._set(full)
    return full
  },
  async update(id, patch) {
    const cur = store().entries[id]
    if (cur) store()._set({ ...cur, ...patch })
  },
  async remove(id) {
    store()._remove(id)
  },
}

// ── Supabase provider (production) ────────────────────────────────────────────
function rowToEntry(r: any): StoryEntry {
  return {
    id: r.id,
    childId: r.child_id,
    grade: r.grade,
    kind: r.kind,
    title: r.title ?? '',
    body: r.body ?? '',
    postcardNote: r.postcard_note ?? '',
    mediaUrl: r.media_url ?? undefined,
    occurredOn: r.occurred_on,
    createdAt: new Date(r.created_at).getTime(),
  }
}

const supabaseStoryboardService: StoryboardService = {
  async list(childId) {
    if (!supabase) return []
    const { data } = await supabase.from('storyboard_entries').select('*').eq('child_id', childId)
    const entries = (data ?? []).map(rowToEntry)
    entries.forEach((e) => store()._set(e))
    return entries
  },
  async add(entry) {
    assertPhotoCap(entry)
    const { data: u } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
    const row = {
      account_id: u.user?.id,
      child_id: entry.childId,
      grade: entry.grade,
      kind: entry.kind,
      title: entry.title,
      body: entry.body,
      postcard_note: entry.postcardNote,
      media_url: entry.mediaUrl,
      occurred_on: entry.occurredOn,
    }
    let full: StoryEntry
    if (supabase) {
      const { data, error } = await supabase.from('storyboard_entries').insert(row).select().single()
      if (error) throw new Error(error.message)
      full = rowToEntry(data)
    } else {
      full = { ...entry, id: `story-${Date.now()}`, createdAt: Date.now() }
    }
    store()._set(full)
    return full
  },
  async update(id, patch) {
    const cur = store().entries[id]
    if (cur) store()._set({ ...cur, ...patch })
    if (!supabase) return
    await supabase.from('storyboard_entries').update({
      title: patch.title,
      body: patch.body,
      postcard_note: patch.postcardNote,
      occurred_on: patch.occurredOn,
    }).eq('id', id)
  },
  async remove(id) {
    store()._remove(id)
    if (supabase) await supabase.from('storyboard_entries').delete().eq('id', id)
  },
}

export const storyboardService: StoryboardService =
  AUTH_PROVIDER === 'supabase' ? supabaseStoryboardService : mockStoryboardService
