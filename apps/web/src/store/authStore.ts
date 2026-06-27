import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, isMockAuth, type AuthSession } from '@/services/authService'
import { ADMIN_PHONE } from '@/lib/env'

export type UserRole = 'PARENT' | 'STUDENT' | 'TEACHER' | 'COACH' | 'ADMIN'

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
  role: UserRole
  kids: KidProfile[]
  createdAt: number
}

// ── Per-phone OTP attempt tracking ────────────────────────────────────────────
export interface PhoneAttemptState {
  failedOtpCount: number
  otpLockedUntil: number    // epoch ms; 0 = not locked
  resendCount: number
  resendLockedUntil: number // epoch ms; 0 = not locked
}

const DEFAULT_ATTEMPTS: PhoneAttemptState = {
  failedOtpCount: 0,
  otpLockedUntil: 0,
  resendCount: 0,
  resendLockedUntil: 0,
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

  // Lockout/attempt tracking, persisted per phone
  phoneAttempts: Record<string, PhoneAttemptState>

  // Flat read-through of accounts[activePhone] (backward compat with all pages)
  adminName: string
  adminAvatar: string
  adminPhotoUrl?: string
  role: UserRole
  kids: KidProfile[]

  // Active kid in current session
  activeKidId: string | null

  // Platform admin (gated console access)
  isAdmin: boolean

  // Actions
  init:           () => Promise<void>
  /** Start Google OAuth (redirect). Returns an error if the backend isn't set up. */
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>
  adminLogin:     () => void
  adminAddAccount:(phone: string, name: string, role: UserRole) => void
  adminAddChild:  (phone: string, kid: Omit<KidProfile, 'id' | 'isOnboarded'>) => void
  submitPhone:    (phone: string) => Promise<{ otp: string; locked: boolean; lockedUntil: number; error?: string }>
  /** Generalized login — accepts an email or a phone as the identifier. */
  submitIdentifier: (value: string) => Promise<{ otp: string; locked: boolean; lockedUntil: number; error?: string }>
  verifyOtp:      (code: string) => Promise<{ success: boolean; locked: boolean; lockedUntil: number; attemptsLeft: number; error?: string }>
  completeSetup:  (name: string, avatar: string, role: UserRole, photoUrl?: string) => void
  updateAdmin:    (patch: { adminName?: string; adminAvatar?: string; adminPhotoUrl?: string }) => void
  selectProfile:  (kidId: string | null) => void
  addKid:         (kid: Omit<KidProfile, 'id' | 'isOnboarded'>) => void
  updateKid:      (kidId: string, patch: Partial<KidProfile>) => void
  markOnboarded:  (kidId: string, data: KidOnboardingData) => void
  removeKid:      (kidId: string) => void
  adminRemoveAccount: (phone: string) => void
  adminRemoveChild:   (phone: string, kidId: string) => void
  logout:         () => void
  goToProfiles:   () => void
  getPhoneAttempts: (phone: string) => PhoneAttemptState
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10)
}

/** Normalize either an email (lower-cased) or a phone (last 10 digits). */
function normalizeId(raw: string): string {
  return raw.includes('@') ? raw.trim().toLowerCase() : normalizePhone(raw)
}

const OTP_MAX_FAILS    = 5
const OTP_LOCK_MS      = 15 * 60 * 1000  // 15 minutes
const RESEND_MAX       = 3
const RESEND_LOCK_MS   = 10 * 60 * 1000  // 10 minutes

const BLANK_SESSION = {
  isAuthenticated: false,
  isAdmin: false,
  step: 'phone' as const,
  phone: '',
  pendingPhone: '',
  demoOtp: '',
  activePhone: '',
  activeKidId: null,
  adminName: '',
  adminAvatar: '👨',
  adminPhotoUrl: undefined as string | undefined,
  role: 'PARENT' as UserRole,
  kids: [] as KidProfile[],
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accounts: {},
      phoneAttempts: {},
      ...BLANK_SESSION,

      // Reconcile persisted state with the real auth backend on app load.
      // Mock mode trusts the persisted store; Supabase mode trusts the live session.
      async init() {
        if (isMockAuth) return
        // Reconcile a backend session (OTP or Google OAuth) into the store. For a
        // first-time OAuth user with no local account yet, auto-provision one from
        // the Google profile so they land straight on the profile picker.
        const apply = (session: AuthSession | null) => {
          if (!session) { set({ ...BLANK_SESSION }); return }
          const id = normalizeId(session.phone)
          const existing = get().accounts[id]
          if (existing) {
            set({
              isAuthenticated: true, activePhone: id, step: 'profiles',
              adminName: existing.adminName, adminAvatar: existing.adminAvatar,
              adminPhotoUrl: existing.adminPhotoUrl, role: existing.role ?? 'PARENT', kids: existing.kids,
            })
          } else {
            const account: UserAccount = {
              phone: id,
              adminName: session.name ?? session.email?.split('@')[0] ?? 'Parent',
              adminAvatar: '👤', adminPhotoUrl: session.avatarUrl,
              role: 'PARENT', kids: [], createdAt: Date.now(),
            }
            set(s => ({
              accounts: { ...s.accounts, [id]: account },
              isAuthenticated: true, activePhone: id, step: 'profiles',
              adminName: account.adminName, adminAvatar: account.adminAvatar,
              adminPhotoUrl: account.adminPhotoUrl, role: 'PARENT', kids: [],
            }))
          }
        }
        apply(await authService.getSession())
        authService.onChange(apply)
      },

      async loginWithGoogle() {
        return authService.signInWithGoogle()
      },

      async submitPhone(displayPhone) {
        const normalized = normalizePhone(displayPhone)
        const now        = Date.now()
        const attempts   = get().phoneAttempts[normalized] ?? { ...DEFAULT_ATTEMPTS }

        // Resend lockout check
        if (attempts.resendCount >= RESEND_MAX && attempts.resendLockedUntil > now) {
          return { otp: '', locked: true, lockedUntil: attempts.resendLockedUntil }
        }

        const res = await authService.requestOtp(normalized)
        if (!res.ok) {
          return { otp: '', locked: false, lockedUntil: 0, error: res.error ?? 'Could not send OTP' }
        }

        const newCount  = attempts.resendLockedUntil <= now ? 1 : attempts.resendCount + 1
        const lockUntil = newCount >= RESEND_MAX ? now + RESEND_LOCK_MS : 0

        set(s => ({
          phone: displayPhone,
          pendingPhone: normalized,
          step: 'otp',
          demoOtp: res.devOtp ?? '',
          phoneAttempts: {
            ...s.phoneAttempts,
            [normalized]: {
              ...attempts,
              resendCount: newCount,
              resendLockedUntil: lockUntil,
            },
          },
        }))
        return { otp: res.devOtp ?? '', locked: false, lockedUntil: 0 }
      },

      // Generalized: accepts an email or phone. Same OTP + lockout flow, but the
      // identifier isn't digit-stripped (so emails survive intact).
      async submitIdentifier(value) {
        const normalized = normalizeId(value)
        const now        = Date.now()
        const attempts   = get().phoneAttempts[normalized] ?? { ...DEFAULT_ATTEMPTS }

        if (attempts.resendCount >= RESEND_MAX && attempts.resendLockedUntil > now) {
          return { otp: '', locked: true, lockedUntil: attempts.resendLockedUntil }
        }

        const res = await authService.requestOtp(normalized)
        if (!res.ok) {
          return { otp: '', locked: false, lockedUntil: 0, error: res.error ?? 'Could not send code' }
        }

        const newCount  = attempts.resendLockedUntil <= now ? 1 : attempts.resendCount + 1
        const lockUntil = newCount >= RESEND_MAX ? now + RESEND_LOCK_MS : 0

        set(s => ({
          phone: value.trim(),
          pendingPhone: normalized,
          step: 'otp',
          demoOtp: res.devOtp ?? '',
          phoneAttempts: {
            ...s.phoneAttempts,
            [normalized]: { ...attempts, resendCount: newCount, resendLockedUntil: lockUntil },
          },
        }))
        return { otp: res.devOtp ?? '', locked: false, lockedUntil: 0 }
      },

      async verifyOtp(code) {
        const { pendingPhone, accounts, phoneAttempts } = get()
        const now      = Date.now()
        const attempts = phoneAttempts[pendingPhone] ?? { ...DEFAULT_ATTEMPTS }

        // Already locked?
        if (attempts.otpLockedUntil > now) {
          return { success: false, locked: true, lockedUntil: attempts.otpLockedUntil, attemptsLeft: 0 }
        }

        const result  = await authService.verifyOtp(pendingPhone, code)
        const correct = result.ok

        if (correct) {
          const existing = accounts[pendingPhone]
          const clearedAttempts = { ...DEFAULT_ATTEMPTS }

          if (existing) {
            set(s => ({
              isAuthenticated: true,
              activePhone: pendingPhone,
              step: 'profiles',
              adminName: existing.adminName,
              adminAvatar: existing.adminAvatar,
              adminPhotoUrl: existing.adminPhotoUrl,
              role: existing.role ?? 'PARENT',
              kids: existing.kids,
              phoneAttempts: { ...s.phoneAttempts, [pendingPhone]: clearedAttempts },
            }))
          } else {
            set(s => ({
              step: 'setup',
              phoneAttempts: { ...s.phoneAttempts, [pendingPhone]: clearedAttempts },
            }))
          }
          return { success: true, locked: false, lockedUntil: 0, attemptsLeft: OTP_MAX_FAILS }
        }

        // Wrong code — increment counter
        const newCount   = attempts.failedOtpCount + 1
        const nowLocked  = newCount >= OTP_MAX_FAILS
        const lockUntil  = nowLocked ? now + OTP_LOCK_MS : attempts.otpLockedUntil

        set(s => ({
          phoneAttempts: {
            ...s.phoneAttempts,
            [pendingPhone]: {
              ...attempts,
              failedOtpCount: newCount,
              otpLockedUntil: lockUntil,
            },
          },
        }))

        return {
          success: false,
          locked: nowLocked,
          lockedUntil: lockUntil,
          attemptsLeft: Math.max(0, OTP_MAX_FAILS - newCount),
        }
      },

      completeSetup(name, avatar, role, photoUrl) {
        const { pendingPhone } = get()
        const newAccount: UserAccount = {
          phone: pendingPhone,
          adminName: name,
          adminAvatar: avatar,
          adminPhotoUrl: photoUrl,
          role,
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
          role,
          kids: [],
          phoneAttempts: {
            ...s.phoneAttempts,
            [pendingPhone]: { ...DEFAULT_ATTEMPTS },
          },
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

      adminRemoveAccount(phone) {
        set(s => {
          const accounts = { ...s.accounts }
          delete accounts[phone]
          return phone === s.activePhone ? { ...BLANK_SESSION, accounts } : { accounts }
        })
      },

      adminRemoveChild(phone, kidId) {
        set(s => {
          const acct = s.accounts[phone]
          if (!acct) return s
          const newKids = acct.kids.filter(k => k.id !== kidId)
          const accounts = { ...s.accounts, [phone]: { ...acct, kids: newKids } }
          return phone === s.activePhone
            ? { accounts, kids: newKids, activeKidId: s.activeKidId === kidId ? null : s.activeKidId }
            : { accounts }
        })
      },

      adminLogin() {
        set({
          ...BLANK_SESSION,
          isAuthenticated: true,
          isAdmin: true,
          step: 'profiles',
          role: 'ADMIN',
          activePhone: ADMIN_PHONE ? normalizePhone(ADMIN_PHONE) : 'admin',
          adminName: 'Administrator',
          adminAvatar: '🛡️',
        })
      },

      adminAddAccount(phone, name, role) {
        const normalized = normalizePhone(phone)
        if (!normalized) return
        set(s => {
          if (s.accounts[normalized]) return s
          const account: UserAccount = {
            phone: normalized, adminName: name, adminAvatar: '👤', role, kids: [], createdAt: Date.now(),
          }
          return { accounts: { ...s.accounts, [normalized]: account } }
        })
      },

      adminAddChild(phone, kid) {
        const normalized = normalizePhone(phone)
        set(s => {
          const acct = s.accounts[normalized]
          if (!acct) return s
          const newKid: KidProfile = { ...kid, id: `kid-${Date.now()}`, isOnboarded: false }
          const newKids = [...acct.kids, newKid]
          const accounts = { ...s.accounts, [normalized]: { ...acct, kids: newKids } }
          return normalized === s.activePhone ? { accounts, kids: newKids } : { accounts }
        })
      },

      logout() {
        void authService.signOut()
        set({ ...BLANK_SESSION })
      },

      goToProfiles() {
        set({ activeKidId: null })
      },

      getPhoneAttempts(phone) {
        return get().phoneAttempts[normalizePhone(phone)] ?? { ...DEFAULT_ATTEMPTS }
      },
    }),
    { name: 'mk-auth-v2' }
  )
)
