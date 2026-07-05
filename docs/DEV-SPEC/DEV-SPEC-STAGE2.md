# DEV SPEC — Stage 2 (M2 Parent · M3 Child · M9 Commerce)

**Status:** Ready for execution after Stage 1 exit tests pass.
**Scope:** the launch-critical path — children, the daily loop, and money.
**Spec amendments recorded here (specs updated to match repo reality):**
- **M9-A1:** subscriptions are **per-child** (existing 002 model: ₹99/mo · ₹999/yr ·
  1-month trial per child). Entitlements resolve per child; account-level features
  (e.g. `multi_child`) derive from the set of active child subscriptions.
- **M9-A2 (SECURITY):** current wallet RLS lets the client insert transactions and
  update its own balance → self-crediting from the browser console. Fixed in 015:
  ledger is server/RPC-only, balance is trigger-maintained from the ledger.

Included artifacts (repo-relative):
```
supabase/migrations/014_consent.sql
supabase/migrations/015_commerce_v2.sql
apps/web/src/modules/parent/contracts.ts
apps/web/src/modules/child/contracts.ts
apps/web/src/modules/commerce/contracts.ts
apps/web/api/payments/index.js + function.json     ← Razorpay order + webhook
```

---

## PR sequence

### PR-10 — Migration 014 (consent) + M2 assembly
- Apply 014. Move ParentDashboard, KidOnboarding, Pricing + kidsDataStore into
  `modules/parent/`; implement `ParentContract`.
- Child creation emits `child.created` (with `isFirstChild`) on the bus.
- Consent center UI: per-child toggles for `community_visibility`, `coach_sharing`,
  `school_sharing` (+ read-only `data_processing` accepted at onboarding), and a
  "request my data / delete my data" button that files an M10 review item (manual
  runbook until automated).
**Accept:** consents persist + emit `consent.changed`; boundary lint clean for
`modules/parent`; child CRUD regression-free.

### PR-11 — Migration 015 (commerce v2 + wallet hardening)
Apply 015 to staging FIRST and run the wallet exploit test before/after:
`insert into wallet_transactions(account_id, amount, reason) values (auth.uid(), 100000,'x')`
must succeed before and be **rejected** after.
**Accept:** plans served from DB; exploit closed; balances recomputed correctly from
ledger (backfill verified against old stored balances; discrepancies logged for manual
review, not silently overwritten).

### PR-12 — M9 module + Razorpay checkout
- `modules/commerce/`: implement `CommerceContract`; move Subscription page +
  subscriptionStore/walletStore in.
- `api/payments` Function: `create_order` (server creates Razorpay order for a
  child+plan) and `webhook` (signature-verified; idempotent by `gateway_event_id`;
  flips subscription state transactionally; writes `payments` + `invoices`).
- Trial-on-first-child: M9 bus handler on `child.created` → if `isFirstChild` and no
  prior subscription for that child → create `trialing` subscription (transactional in
  M9, event is notification only — M13 §4.5).
- Feature gating: `hasFeature(childId | accountId, feature)` reading plan → feature map;
  adopt at 2+ call sites (e.g. olympiad-pro gate, multi-child gate).
**Accept:** end-to-end in staging with Razorpay test keys: checkout → webhook →
`subscription.activated` → gate opens. Webhook replay (same event id) is a no-op.
Dunning: simulate `payment.failed` → `past_due` + M12 notice; 7-day grace →
`expired` via the daily reconcile job.

### PR-13 — M3 assembly: child shell + daily loop
- Move ChildDashboard, Daily, MyPlanner, planner/engagement stores into `modules/child/`;
  implement `ChildContract`.
- Child shell: selection emits `child.selected`; child-safe route guard (no
  parent/billing/community-posting routes in child mode; PIN to exit — PR-7 machinery).
- Streak/engagement rules consolidated into `modules/child/engagement.ts` with unit
  tests (the policy file from the M3 spec).
- `getProgressSummary()` consumed by M2 dashboard cards (composition proof).
**Accept:** daily loop works scoped to selected child; streak tests green; parent
dashboard renders from contract only (no direct table reads across the seam).

### PR-14 — Cross-module integration pass
Wire the full Stage-2 story and demo it in staging:
create child → trial starts → child completes feed item → streak up →
parent dashboard reflects it → notification lands → upgrade via Razorpay test →
gated feature opens.
**Accept:** the demo script runs clean twice in a row (idempotency), event ledger shows
the expected sequence, zero boundary-lint errors in the three migrated modules.

## Test matrix (Stage 2 exit)
| Area | Test |
|---|---|
| Wallet | client self-credit rejected; RPC spend fails on insufficient balance; balance == sum(ledger) invariant test |
| Webhook | bad signature 401; replayed event no-op; out-of-order events safe |
| Trial | second child ≠ auto-trial (per-child rule honored: only first child auto-trials; others prompt) |
| Consent | community post about child blocked without `community_visibility` (stub check until M7) |
| Child mode | route guard: billing unreachable; PIN exit enforced |
| RLS | parent B cannot read parent A's subscriptions/wallet/consents |

## Non-goals
No coach flows (Stage 3), no content migration (Stage 3/M8), no invoice PDF rendering
(number + record now; rendering when GST filing demands it).
