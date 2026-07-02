import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

// ── Worksheet wallet ──────────────────────────────────────────────────────────
// Every account starts with ₹100 (100 credits). Opening/downloading a library
// worksheet costs 1 credit — but only the FIRST time: once bought, the sheet is
// owned by the account and re-opens free on any device profile.
// Mirrored best-effort to Supabase wallets/wallet_transactions when signed in.

export const WALLET_SEED_CREDITS = 100
export const WORKSHEET_COST = 1

export interface WalletTransaction {
  id: string
  amount: number          // negative = spend, positive = top-up
  reason: string
  at: number
}

interface WalletAccount {
  balance: number
  owned: string[]         // worksheet keys already purchased (e.g. 'class4/maths/MK-...pdf')
  transactions: WalletTransaction[]
}

interface WalletState {
  wallets: Record<string, WalletAccount>
  /** Create the wallet with the ₹100 seed if it doesn't exist yet. */
  ensureWallet: (accountId: string) => void
  /** Charge for a worksheet (1 credit, first open only). */
  buyWorksheet: (accountId: string, key: string, title: string) =>
    { ok: boolean; charged: boolean; balance: number }
  ownsWorksheet: (accountId: string, key: string) => boolean
  balanceOf: (accountId: string) => number
  topUp: (accountId: string, amount: number, reason: string) => void
}

const freshWallet = (): WalletAccount => ({
  balance: WALLET_SEED_CREDITS,
  owned: [],
  transactions: [{
    id: `t-${Date.now()}`,
    amount: WALLET_SEED_CREDITS,
    reason: 'Welcome credit — ₹100',
    at: Date.now(),
  }],
})

function mirror(accountKey: string, balance: number, tx: WalletTransaction) {
  if (!supabase) return
  supabase.auth.getUser().then(({ data }) => {
    const uid = data.user?.id
    if (!uid) return
    void supabase!.from('wallets').upsert({ id: uid, balance }).then(() => {})
    void supabase!.from('wallet_transactions')
      .insert({ account_id: uid, amount: tx.amount, reason: tx.reason })
      .then(({ error }) => { if (error) console.warn('[wallet] mirror failed:', error.message) })
  })
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: {},

      ensureWallet(accountId) {
        if (!accountId || get().wallets[accountId]) return
        set(s => ({ wallets: { ...s.wallets, [accountId]: freshWallet() } }))
      },

      buyWorksheet(accountId, key, title) {
        get().ensureWallet(accountId)
        const w = get().wallets[accountId]
        if (!w) return { ok: false, charged: false, balance: 0 }
        if (w.owned.includes(key)) return { ok: true, charged: false, balance: w.balance }
        if (w.balance < WORKSHEET_COST) return { ok: false, charged: false, balance: w.balance }
        const tx: WalletTransaction = {
          id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          amount: -WORKSHEET_COST,
          reason: `Worksheet: ${title}`,
          at: Date.now(),
        }
        const balance = w.balance - WORKSHEET_COST
        set(s => ({
          wallets: {
            ...s.wallets,
            [accountId]: {
              balance,
              owned: [...w.owned, key],
              transactions: [tx, ...w.transactions].slice(0, 200),
            },
          },
        }))
        mirror(accountId, balance, tx)
        return { ok: true, charged: true, balance }
      },

      ownsWorksheet(accountId, key) {
        return get().wallets[accountId]?.owned.includes(key) ?? false
      },

      balanceOf(accountId) {
        return get().wallets[accountId]?.balance ?? WALLET_SEED_CREDITS
      },

      topUp(accountId, amount, reason) {
        get().ensureWallet(accountId)
        const w = get().wallets[accountId]
        if (!w || amount <= 0) return
        const tx: WalletTransaction = { id: `t-${Date.now()}`, amount, reason, at: Date.now() }
        const balance = w.balance + amount
        set(s => ({
          wallets: { ...s.wallets, [accountId]: { ...w, balance, transactions: [tx, ...w.transactions].slice(0, 200) } },
        }))
        mirror(accountId, balance, tx)
      },
    }),
    { name: 'mk-wallet-v1' },
  ),
)
