# Master-Kids — Azure Cost Model

> Goal: keep the running platform **under $10/month** at MVP / low traffic, with a clear,
> no-rewrite path to 1,000,000 users. Prices are indicative (USD, India/Central regions,
> 2026) — confirm against the Azure Pricing Calculator before committing.

---

## 1. The core idea — why this stays near $0

**Azure Static Web Apps (Free tier)** hosts *both* the React app *and* the serverless API
(managed Functions) at **$0**, including global CDN, free SSL, and free PR preview environments.
Combined with **Supabase Free tier** (Postgres + Auth + 1 GB storage) for data, the only variable
costs are **AI usage** and **optional SMS** — both controllable and near-zero at low volume.

The platform is **serverless / consumption-based end to end**, so when nobody is using it, the
bill is essentially the storage of a few GB of files.

---

## 2. MVP monthly cost (low traffic: ~hundreds of users)

| Component | Service / tier | Est. monthly |
|---|---|---|
| Web hosting + CDN + SSL | Azure Static Web Apps — **Free** | **$0** |
| Serverless API (`/api/chat`, `/api/otp`, `/api/pay`, `/api/admin`) | SWA **managed Functions** (included in Free) | **$0** |
| Database + Auth (OTP) + Realtime | Supabase **Free** (Postgres 500 MB, 50K MAU auth, 1 GB storage) | **$0** |
| Media/file storage (photos, certificates, book pages) | Supabase Storage 1 GB free → overflow Azure Blob @ ~$0.018/GB | **$0–1** |
| AI (summaries, structuring, assist) | OpenAI `gpt-4o-mini` / Claude Haiku, pay-per-token, **cached** | **$2–5** |
| OTP delivery | Email/WhatsApp OTP (free); SMS only if required (~₹0.15/msg) | **$0–2** |
| **Total** | | **≈ $2 – $8** ✅ |

**Staying under $10 — the levers:**
1. **Cache AI output.** Daily/weekly summaries and the daily feed regenerate only when inputs
   change. Knowledge/quote content is static. This is the single biggest cost control.
2. **Use the cheap model for volume.** Haiku/`gpt-4o-mini` for structuring; reserve Sonnet for
   premium weekly reports only.
3. **Prefer email/WhatsApp OTP** over SMS until volume justifies it.
4. **Keep content as static catalog** (CDN/Redis) — it never hits the paid AI or DB hot path.
5. **No always-on compute.** Everything scales to zero.

---

## 3. What is explicitly NOT on the bill at MVP
- No VM / App Service plan (would be ~$13+/mo always-on — avoided).
- No Azure Postgres Flexible Server yet (~$12–15/mo burstable — Supabase free instead).
- No Azure Front Door / dedicated CDN (SWA CDN is included).
- No Redis, no Service Bus (added only at scale).

---

## 4. Scale path & cost growth

Costs rise **with usage**, and only the components that need it change tier.

| Stage | Users | Key changes | Indicative monthly |
|---|---|---|---|
| **MVP** | < 1K | SWA Free + Supabase Free | **$2–8** |
| **Early growth** | 1K–25K | SWA **Standard** ($9) for SLA/more functions; Supabase **Pro** ($25); Blob+CDN for media | **$50–120 + AI** |
| **Scale** | 25K–250K | API on **Container Apps** (scale-to-zero→autoscale) behind **Front Door**; **Postgres Flexible** + read replica; **Upstash Redis**; **Service Bus** for async AI | **$300–1,500 + AI** |
| **1M users** | 1M | Multi-replica Postgres (or Cosmos autoscale, partitioned by `account_id`); CDN-cached content catalog; AI cost dominates and is usage-driven | infra **$2–6K** + AI (the real variable) |

At 1M users the **dominant cost is AI inference**, not infrastructure — which is exactly why the
architecture pushes static content to CDN, caches aggressively, and routes high-volume work to the
cheapest capable model. Infra remains a manageable fraction.

---

## 5. Cost-control checklist (engineering rules)
- [ ] AI responses cached; never regenerate without changed inputs (`ai_summaries`, `daily_feed`).
- [ ] Haiku/`gpt-4o-mini` for high-volume structuring; Sonnet only for premium reports.
- [ ] Content catalog (books, olympiad, knowledge, quotes) served from CDN/Redis, not DB-per-request.
- [ ] Media auto-expiry for raw audio (30-day max).
- [ ] Email/WhatsApp OTP default; SMS gated behind volume.
- [ ] Everything consumption-tier until metrics justify a paid tier.
- [ ] Budget alert in Azure Cost Management at $8 and $10.
- [ ] Per-environment Supabase projects on Free tier (dev/staging) so non-prod stays $0.

---

## 6. One-time / out-of-scope costs (not monthly)
- Domain name: ~$10–15/year (~$1/mo amortized) — optional; SWA gives a free `*.azurestaticapps.net`.
- Apple Developer ($99/yr) + Google Play ($25 one-time) — only when the native mobile track starts.
- Razorpay: no monthly fee; per-transaction % only when real payments go live.
