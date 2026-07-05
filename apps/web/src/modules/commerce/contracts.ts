// modules/commerce/contracts.ts — M9 Commerce (spec §4, amended M9-A1: per-child subs)

export type PlanId = 'free_trial' | 'monthly' | 'yearly' | (string & {})
export type FeatureKey = 'core' | 'olympiad_pro' | 'weekly_report' | 'multi_child' | (string & {})

export interface Plan {
  id: PlanId
  name: string
  amountInr: number
  period: 'month' | 'year' | 'trial'
  features: Record<string, boolean>
}

export interface Subscription {
  childId: string
  plan: PlanId
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' | 'skipped_test'
  trialEndsAt?: string
  currentPeriodEnd?: string
}

export interface WalletTx { id: string; amount: number; reason: string; createdAt: string }

export interface CommerceContract {
  getPlans(): Promise<Plan[]>
  /** Per-child model (M9-A1). */
  getSubscription(childId: string): Promise<Subscription | null>
  listMySubscriptions(): Promise<Subscription[]>
  /** Creates a Razorpay order server-side; returns checkout params for the JS SDK. */
  startCheckout(childId: string, planId: PlanId): Promise<{
    orderId: string; keyId: string; amountInr: number
  }>
  /** Child-scoped feature gate. Account-level features (multi_child) pass accountId. */
  hasFeature(scope: { childId: string } | { accountId: string }, feature: FeatureKey): Promise<boolean>
  getWallet(): Promise<{ balanceInr: number; tx: WalletTx[] }>
  /** Client-side spends only (RPC wallet_spend); credits are server-side. */
  spendFromWallet(amountInr: number, reason: string): Promise<{ balanceInr: number }>
}
