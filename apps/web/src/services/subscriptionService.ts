// ── Subscription service boundary ────────────────────────────────────────────
// The UI talks only to this. Two impls behind it (same pattern as authService):
//   • supabase — writes the real subscriptions/payments tables (production).
//   • mock     — write-through to the persisted subscriptionStore (zero config).
// Both mirror into the store so the UI reacts identically in either mode.

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER } from '@/lib/env'
import {
  useSubscriptionStore,
  type Subscription,
} from '@/store/subscriptionStore'

export const PLAN_PRICING = {
  monthly: { inr: 99, days: 30, label: 'Monthly', period: '/month' },
  yearly:  { inr: 999, days: 365, label: 'Yearly', period: '/year' },
} as const

export const TRIAL_DAYS = 30
const DAY = 86_400_000

export interface SubscriptionService {
  getForChild(childId: string): Promise<Subscription | null>
  startFreeTrial(childId: string): Promise<Subscription>
  subscribe(childId: string, plan: 'monthly' | 'yearly'): Promise<Subscription>
  /** Test-only bypass — the Change Request "skip / pass" button. */
  skipForTest(childId: string): Promise<Subscription>
}

const store = () => useSubscriptionStore.getState()

// ── Mock provider ─────────────────────────────────────────────────────────────
const mockSubscriptionService: SubscriptionService = {
  async getForChild(childId) {
    return store().subs[childId] ?? null
  },
  async startFreeTrial(childId) {
    const sub: Subscription = {
      childId,
      plan: 'free_trial',
      status: 'trialing',
      startedAt: Date.now(),
      currentPeriodEnd: Date.now() + TRIAL_DAYS * DAY,
    }
    store()._set(sub)
    return sub
  },
  async subscribe(childId, plan) {
    const sub: Subscription = {
      childId,
      plan,
      status: 'active',
      startedAt: Date.now(),
      currentPeriodEnd: Date.now() + PLAN_PRICING[plan].days * DAY,
    }
    store()._set(sub)
    return sub
  },
  async skipForTest(childId) {
    const sub: Subscription = {
      childId,
      plan: 'free_trial',
      status: 'skipped_test',
      startedAt: Date.now(),
      currentPeriodEnd: Number.MAX_SAFE_INTEGER,
    }
    store()._set(sub)
    return sub
  },
}

// ── Supabase provider (production-ready; active once children live in Postgres) ─
async function currentAccountId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

function rowToSub(row: any): Subscription {
  return {
    childId: row.child_id,
    plan: row.plan,
    status: row.status,
    startedAt: new Date(row.created_at).getTime(),
    currentPeriodEnd: row.current_period_end
      ? new Date(row.current_period_end).getTime()
      : 0,
  }
}

const supabaseSubscriptionService: SubscriptionService = {
  async getForChild(childId) {
    if (!supabase) return null
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) return null
    const sub = rowToSub(data)
    store()._set(sub)
    return sub
  },
  async startFreeTrial(childId) {
    return upsertSub(childId, 'free_trial', 'trialing', TRIAL_DAYS, 0)
  },
  async subscribe(childId, plan) {
    const { inr, days } = PLAN_PRICING[plan]
    const sub = await upsertSub(childId, plan, 'active', days, inr)
    await recordPayment(childId, inr, 'razorpay', 'created')
    return sub
  },
  async skipForTest(childId) {
    const sub = await upsertSub(childId, 'free_trial', 'skipped_test', 0, 0)
    await recordPayment(childId, 0, 'test_skip', 'skipped_test')
    return sub
  },
}

async function upsertSub(
  childId: string,
  plan: Subscription['plan'],
  status: Subscription['status'],
  days: number,
  amountInr: number,
): Promise<Subscription> {
  const accountId = await currentAccountId()
  const now = Date.now()
  const periodEnd = status === 'skipped_test' ? null : new Date(now + days * DAY).toISOString()
  const row = {
    account_id: accountId,
    child_id: childId,
    plan,
    status,
    amount_inr: amountInr,
    trial_ends_at: plan === 'free_trial' && status !== 'skipped_test' ? periodEnd : null,
    current_period_end: periodEnd,
    updated_at: new Date(now).toISOString(),
  }
  if (supabase) await supabase.from('subscriptions').insert(row)
  const sub: Subscription = {
    childId,
    plan,
    status,
    startedAt: now,
    currentPeriodEnd: status === 'skipped_test' ? Number.MAX_SAFE_INTEGER : now + days * DAY,
  }
  store()._set(sub)
  return sub
}

async function recordPayment(
  childId: string,
  amountInr: number,
  provider: string,
  status: string,
) {
  if (!supabase) return
  const accountId = await currentAccountId()
  await supabase.from('payments').insert({
    account_id: accountId,
    target_type: 'child_subscription',
    target_id: childId,
    amount_inr: amountInr,
    provider,
    status,
  })
}

export const subscriptionService: SubscriptionService =
  AUTH_PROVIDER === 'supabase' ? supabaseSubscriptionService : mockSubscriptionService
