import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Platform-operator state: suspend flags (reversible), module feature flags, and
// an audit log. Hard removals go through authStore admin methods. In production
// these actions run server-side via the service role (see docs/DATA_MODEL.md §9).

export interface AuditEntry {
  id: string
  action: string
  target: string
  at: number
}

export const MODULES = [
  { key: 'storyboard', label: 'Storyboard' },
  { key: 'academic', label: 'Academics' },
  { key: 'olympiad', label: 'Olympiad' },
  { key: 'social', label: 'Community' },
  { key: 'activities', label: 'Extra-curricular' },
  { key: 'coach', label: 'Coach Studio' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'engagement', label: 'Daily / Weekend' },
] as const

interface AdminState {
  suspendedAccounts: Record<string, boolean>
  suspendedChildren: Record<string, boolean>
  suspendedCoaches: Record<string, boolean>
  moduleFlags: Record<string, boolean> // key → enabled (absent = enabled)
  audit: AuditEntry[]
  toggleAccount: (phone: string) => void
  toggleChild: (id: string) => void
  toggleCoach: (id: string) => void
  toggleModule: (key: string) => void
  log: (action: string, target: string) => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      suspendedAccounts: {}, suspendedChildren: {}, suspendedCoaches: {}, moduleFlags: {}, audit: [],
      toggleAccount: (phone) => { const v = !get().suspendedAccounts[phone]; set((s) => ({ suspendedAccounts: { ...s.suspendedAccounts, [phone]: v } })); get().log(v ? 'Suspended account' : 'Restored account', phone) },
      toggleChild: (id) => { const v = !get().suspendedChildren[id]; set((s) => ({ suspendedChildren: { ...s.suspendedChildren, [id]: v } })); get().log(v ? 'Suspended child' : 'Restored child', id) },
      toggleCoach: (id) => { const v = !get().suspendedCoaches[id]; set((s) => ({ suspendedCoaches: { ...s.suspendedCoaches, [id]: v } })); get().log(v ? 'Suspended coach' : 'Restored coach', id) },
      toggleModule: (key) => { const v = get().moduleFlags[key] === false ? true : false; set((s) => ({ moduleFlags: { ...s.moduleFlags, [key]: v } })); get().log(v ? 'Enabled module' : 'Disabled module', key) },
      log: (action, target) => set((s) => ({ audit: [{ id: `a-${Date.now()}`, action, target, at: Date.now() }, ...s.audit].slice(0, 50) })),
    }),
    { name: 'mk-admin-v1' },
  ),
)

export const moduleEnabled = (flags: Record<string, boolean>, key: string) => flags[key] !== false
