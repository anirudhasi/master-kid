import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Per-kid onboarding data ────────────────────────────────────────────────────
export interface KidOnboardingData {
  section: string
  classTeacher: string
  subjects: string[]
  subjectGoalMins: Record<string, number>
  activities: string[]
  lifeGoal: string
  targetYear: number
}

// ── Kid profile ────────────────────────────────────────────────────────────────
export interface KidProfile {
  id: string
  name: string
  grade: string
  age: number
  school: string
  avatar: string
  color: string
  colorLight: string
  board: string
  xpTotal: number
  streakDays: number
  photoUrl?: string
  isOnboarded: boolean
  onboarding?: KidOnboardingData
}

// ── Per-user account (one per phone number) ────────────────────────────────────
interface UserAccount {
  phone: string
  adminName: string
  adminAvatar: string
  adminPhotoUrl?: string
  kids: KidProfile[]
  createdAt: number
}

// ── Store interface ────────────────────────────────────────────────────────────
export interface AuthStore {
  // All accounts ever signed in, keyed by 10-digit phone
  accounts: Record<string, UserAccount>
  activePhone: string

  // Auth flow
  isAuthenticated: boolean
  phone: string          // display string shown in OTP step
  pendingPhone: string   // normalized 10-digit being verified
  step: 'phone' | 'otp' | 'setup' | 'profiles'
  demoOtp: string

  // Flat read-through of accounts[activePhone] (backward compat with all pages)
  adminName: string
  adminAvatar: string
  adminPhotoUrl?: string
  kids: KidProfile[]

  // Active kid in current session
  activeKidId: string | null

  // Actions
  submitPhone:    (phone: string) => string
  verifyOtp:      (code: string) => boolean
  completeSetup:  (name: string, avatar: string, photoUrl?: string) => void
  updateAdmin:    (patch: { adminName?: string; adminAvatar?: string; adminPhotoUrl?: string }) => void
  selectProfile:  (kidId: string | null) => void
  addKid:         (kid: Omit<KidProfile, 'id' | 'isOnboarded'>) => void
  updateKid:      (kidId: string, patch: Partial<KidProfile>) => void
  markOnboarded:  (kidId: string, data: KidOnboardingData) => void
  removeKid:      (kidId: string) => void
  logout:         () => void
  goToProfiles:   () => void
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10)
}

const BLANK_SESSION = {
  isAuthenticated: false,
  step: 'phone' as const,
  phone: '',
  pendingPhone: '',
  demoOtp: '',
  activePhone: '',
  activeKidId: null,
  adminName: '',
  adminAvatar: '👨',
  adminPhotoUrl: undefined as string | undefined,
  kids: [] as KidProfile[],
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accounts: {},
      ...BLANK_SESSION,

      submitPhone(displayPhone) {
        const otp        = randomOtp()
        const normalized = normalizePhone(displayPhone)
        set({ phone: displayPhone, pendingPhone: normalized, step: 'otp', demoOtp: otp })
        return otp
      },

      verifyOtp(code) {
        const { demoOtp, pendingPhone, accounts } = get()
        if (code !== demoOtp && code !== '000000') return false

        const existing = accounts[pendingPhone]
        if (existing) {
          // Returning user — load their account into flat fields
          set({
            isAuthenticated: true,
            activePhone: pendingPhone,
            step: 'profiles',
            adminName: existing.adminName,
            adminAvatar: existing.adminAvatar,
            adminPhotoUrl: existing.adminPhotoUrl,
            kids: existing.kids,
          })
        } else {
          // New user — needs profile setup
          set({ step: 'setup' })
        }
        return true
      },

      completeSetup(name, avatar, photoUrl) {
        const { pendingPhone } = get()
        const newAccount: UserAccount = {
          phone: pendingPhone,
          adminName: name,
          adminAvatar: avatar,
          adminPhotoUrl: photoUrl,
          kids: [],
          createdAt: Date.now(),
        }
        set(s => ({
          accounts: { ...s.accounts, [pendingPhone]: newAccount },
          activePhone: pendingPhone,
          isAuthenticated: true,
          step: 'profiles',
          adminName: name,
          adminAvatar: avatar,
          adminPhotoUrl: photoUrl,
          kids: [],
        }))
      },

      updateAdmin(patch) {
        set(s => {
          const account = s.accounts[s.activePhone]
          if (!account) return s
          const updated = { ...account, ...patch }
          return {
            ...(patch.adminName     !== undefined && { adminName: patch.adminName }),
            ...(patch.adminAvatar   !== undefined && { adminAvatar: patch.adminAvatar }),
            ...(patch.adminPhotoUrl !== undefined && { adminPhotoUrl: patch.adminPhotoUrl }),
            accounts: { ...s.accounts, [s.activePhone]: updated },
          }
        })
      },

      selectProfile(kidId) {
        set({ activeKidId: kidId })
      },

      addKid(kid) {
        const id     = `kid-${Date.now()}`
        const newKid: KidProfile = { ...kid, id, isOnboarded: false }
        set(s => {
          const newKids  = [...s.kids, newKid]
          const account  = s.accounts[s.activePhone]
          return {
            kids: newKids,
            accounts: account
              ? { ...s.accounts, [s.activePhone]: { ...account, kids: newKids } }
              : s.accounts,
          }
        })
      },

      updateKid(kidId, patch) {
        set(s => {
          const newKids = s.kids.map(k => k.id === kidId ? { ...k, ...patch } : k)
          const account = s.accounts[s.activePhone]
          return {
            kids: newKids,
            accounts: account
              ? { ...s.accounts, [s.activePhone]: { ...account, kids: newKids } }
              : s.accounts,
          }
        })
      },

      markOnboarded(kidId, data) {
        set(s => {
          const newKids = s.kids.map(k =>
            k.id === kidId ? { ...k, isOnboarded: true, onboarding: data } : k
          )
          const account = s.accounts[s.activePhone]
          return {
            kids: newKids,
            accounts: account
              ? { ...s.accounts, [s.activePhone]: { ...account, kids: newKids } }
              : s.accounts,
          }
        })
      },

      removeKid(kidId) {
        set(s => {
          const newKids = s.kids.filter(k => k.id !== kidId)
          const account = s.accounts[s.activePhone]
          return {
            kids: newKids,
            activeKidId: s.activeKidId === kidId ? null : s.activeKidId,
            accounts: account
              ? { ...s.accounts, [s.activePhone]: { ...account, kids: newKids } }
              : s.accounts,
          }
        })
      },

      logout() {
        // Clear session but keep accounts map — returning users get their data back
        set({ ...BLANK_SESSION })
      },

      goToProfiles() {
        set({ activeKidId: null })
      },
    }),
    { name: 'mk-auth-v2' }   // v2 clears old single-user localStorage
  )
)
