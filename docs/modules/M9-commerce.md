# M9 — Commerce (Module Spec)

**Status:** Draft for sign-off · **Stage:** 2 (launch-critical — public launch needs money to work)

## 1. Responsibility
All money and entitlements: plans, subscriptions, payments, wallet, invoices, and the
single `hasFeature()` gate the rest of the app queries. No other module ever interprets
subscription rows directly.

## 2. Owned data
`subscriptions`, `payments` (002) · `wallets`, `wallet_transactions` (011) ·
`015_commerce_v2.sql`: `plans` (move plan definitions from code to DB so M10 admin can
edit pricing without deploys), `invoices` (GST-compliant numbering — Indian B2C requirement
once revenue is real).

## 3. Key decisions
1. **Gateway: Razorpay** (UPI-first India). All gateway calls + webhook verification in
   SWA Functions `/api/payments/*` — signature checks and entitlement writes are
   server-side ONLY. Browser never mutates subscription state.
2. **Wallet is a closed-loop credit ledger** (refunds, referral credits, promo). Append-only
   `wallet_transactions`; balance is derived, never stored-and-trusted. No cash-out (keeps
   you outside PPI/RBI wallet regulation — revisit with legal counsel if that ever changes).
3. **Entitlement model:** plan → feature flags (`multi_child`, `olympiad_pro`,
   `weekly_report`, `coach_tools`, …). Contract: `hasFeature(accountId, feature)`.
   M10 admin can grant overrides (audited).
4. **Trial:** `child.created` (first child) → trial subscription, transactional in M9's
   handler per M13 rule §4.5.

## 4. Contract
```ts
export interface CommerceContract {
  getPlans(): Promise<Plan[]>
  getSubscription(accountId: string): Promise<Subscription | null>
  startCheckout(planId: string): Promise<{ checkoutUrl: string }>
  hasFeature(accountId: string, feature: FeatureKey): Promise<boolean>
  getWallet(accountId: string): Promise<{ balanceInr: number; tx: WalletTx[] }>
}
```

## 5. Events
Emits: `subscription.activated` · `subscription.expired` · `subscription.payment_failed` ·
`wallet.credited` · `wallet.debited`
Consumes: `child.created` (trial)

## 6. Risks flagged
- Webhook idempotency (Razorpay retries): `payments.gateway_event_id` unique index.
- Dunning: payment_failed → grace period (7d) → downgrade, all via events + M12 notices.

## 7. DoD
- [ ] Migration 015; plans served from DB
- [ ] Razorpay checkout + verified webhook → entitlement flip, end-to-end in staging
- [ ] `hasFeature` adopted by M3/M8 gates (no raw subscription reads anywhere else)
- [ ] Wallet ledger with derived balance + unit tests
