# Master-Kids — Full Product Specification Document
**Version:** 1.0 | **Date:** April 2026 | **Status:** Pre-Development Planning

---

## 1. Executive Summary

Master-Kids is a **habit-forming daily progress tracking system** for children, built around a three-sided marketplace: Parents, Children, and Tutors. The product's defining philosophy is **near-zero friction input** paired with **AI-structured output**, creating a daily loop that is effortless for kids and deeply insightful for parents.

**One-Line Clarity:**
> "Kids log their day in 10 seconds. Parents instantly know if they're improving."

**Target Market:** India-first, English + Hindi, ages 5–14 children, urban/semi-urban households with active tutor engagement.

---

## 2. User Personas — Detailed

### 2.1 The Parent ("Observer → Strategist")
| Attribute | Detail |
|-----------|--------|
| Age | 30–50 |
| Pain Point | Doesn't know what child actually did with tutor; has to ask manually |
| Goal | Real-time visibility without effort |
| Device | Primarily smartphone (Android, iOS) |
| Session Habit | Checks once a day, usually evening |
| Key Feature | AI daily summary pushed via notification |

### 2.2 The Child ("Doer → Achiever")
| Attribute | Detail |
|-----------|--------|
| Age | 5–14 |
| Pain Point | Logging is boring; forgets to do it |
| Goal | Earn points and level up |
| Device | Shared tablet or parent phone |
| Session Habit | Post-study (≤10 seconds) |
| Key Feature | Tap/voice log → instant reward feedback |

### 2.3 The Tutor ("Executor → Discoverable Expert")
| Attribute | Detail |
|-----------|--------|
| Age | 20–40 |
| Pain Point | Admin overhead; no way to showcase work |
| Goal | Visibility, credibility, more leads |
| Device | Own smartphone |
| Session Habit | End of each session |
| Key Feature | Auto-generated session report; profile score |

---

## 3. Core Product Loop

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐
│  INPUT       │────▶│  AI LAYER    │────▶│  OUTPUT                  │
│  Voice/Tap   │     │  Transcribe  │     │  Parent Summary          │
│  Kid/Tutor   │     │  Structure   │     │  Child Reward            │
│              │     │  Enrich      │     │  Tutor Profile Update    │
└──────────────┘     └──────────────┘     └──────────────────────────┘
        ▲                                            │
        └────────────────────────────────────────────┘
                      Daily Habit Loop
```

**Loop Health KPI:** ≥40% users completing the loop 3×/week within 30 days of install.

---

## 4. Feature Specification — All Phases

### 4.1 Phase 1 — Daily Engine (Month 0–2)

#### F-01: Voice Logging (Child)
- **Description:** Child taps microphone button, speaks naturally ("I finished math homework and read 10 pages")
- **Processing:** Whisper / Google STT → Claude AI parses and structures into: Subject, Activity, Duration (estimated), Mood
- **Constraints:** Max 60-second clip; auto-stop on silence >3s
- **Fallback:** Tap-based structured input if mic unavailable
- **Platform:** iOS + Android

#### F-02: Tap-Based Logging (Child)
- **Description:** Pre-set cards: "Math ✅", "Reading ✅", "Music ✅" — one tap = logged
- **Customizable:** Parent can add/remove subjects
- **Reward trigger:** Immediate on tap (haptic + animation)

#### F-03: Parent Daily Summary
- **Delivery:** Push notification at configurable time (default 8 PM)
- **Content:** AI-generated 3–5 line summary of child's day
- **Format:** "Arjun completed Math and English today. He's on a 5-day streak! Music was skipped."
- **Deep link:** Tapping opens full dashboard

#### F-04: Reward System — Basic
- **XP Points:** Awarded per log (10 pts), streak bonus (2× on day 7)
- **Streaks:** Visual calendar heatmap
- **Levels:** Explorer (0–100) → Learner (100–500) → Scholar (500–1500) → Champion (1500+)
- **Badges:** Subject mastery, streak milestones

#### F-05: Child Dashboard
- Today's log card
- Streak flame
- XP progress bar
- Recent badges

#### F-06: Parent Dashboard
- Child summary card
- Weekly trend chart (subjects logged)
- Streak calendar
- Notification preferences

---

### 4.2 Phase 1.5 — Ambient Layer (Month 2–4)

#### F-07: WhatsApp Voice Logging
- Parent/child sends voice note to dedicated WhatsApp Business number
- Webhook → AI transcription → structured log
- Confirmation reply sent back

#### F-08: Google Assistant / Alexa Skill
- "Hey Google, log Arjun's homework" → guided voice flow
- Stores log via API

#### F-09: Tablet Kid Mode
- Kiosk-style simplified UI
- Large tap targets
- No navigation exposed
- Auto-launches on device unlock (optional)

---

### 4.3 Phase 2 — Tutor Layer (Month 4–6)

#### F-10: Tutor Session Logging
- Voice or structured form
- Auto-generates: Topics covered, Homework assigned, Parent notes
- Synced to parent dashboard

#### F-11: Tutor Profile
- Name, subjects, experience, ratings
- Activity score (based on logging frequency)
- "Top Coach" badge system

#### F-12: Tutor Discovery (Basic)
- Parents can search tutors by subject
- Tutor profile card with rating + activity score

---

### 4.4 Phase 3 — Intelligence Layer (Month 6–9)

#### F-13: Weekly Progress Report (Premium)
- AI-generated weekly PDF/in-app report
- Consistency score per subject
- Trend: improving / declining / steady

#### F-14: Skill Gap Insights
- "Math engagement dropped 25% this week"
- "Music practice is above average"

#### F-15: Personalized Recommendations
- Suggest focus areas for next week
- Tutor-specific notes if linked

---

### 4.5 Phase 4 — Hardware Layer (Month 9–15)

#### F-16: Desk Device
- One physical button + voice mic
- LED ring display (streak color)
- BLE connection to phone app
- Firmware OTA via app

#### F-17: Device Management (App)
- Pair, rename, configure
- Streak LED color themes
- Reminder schedule

---

### 4.6 Phase 5 — Marketplace (Month 12+)

#### F-18: AI Tutor Matching
- Based on child subject gaps + tutor specialty
- Lead gen model

#### F-19: Promoted Listings
- Tutors pay for discovery boost

#### F-20: Affiliate & Partnership Integrations
- EdTech content, worksheets, books

---

## 5. Technical Architecture

### 5.1 Mobile Apps (iOS + Android)
- **Framework:** React Native (Expo managed workflow)
- **Rationale:** Single codebase, Expo Go for rapid testing, mature ecosystem, OTA updates via EAS
- **Navigation:** React Navigation v6 (stack + bottom tabs)
- **State Management:** Zustand (lightweight) + React Query (server state)
- **UI Library:** Custom design system (NativeWind / Tailwind-RN)
- **Audio Recording:** expo-av
- **Push Notifications:** Expo Notifications → FCM (Android) + APNs (iOS)
- **Analytics:** PostHog (self-hostable) or Mixpanel

### 5.2 Backend
- **Runtime:** Node.js (TypeScript) on AWS Lambda (serverless)
- **API Gateway:** AWS API Gateway (REST)
- **Framework:** Hono.js (lightweight, edge-compatible)
- **Auth:** Supabase Auth (OTP via SMS/email, Google OAuth)
- **File Storage:** AWS S3 (voice recordings, profile images)
- **Queue:** AWS SQS → Lambda for async AI processing
- **Caching:** Redis (Upstash serverless)

### 5.3 Database
- **Primary DB:** PostgreSQL via Supabase
- **Schema highlights:**
  - `users` (parents, children, tutors — role-based)
  - `children` (linked to parent)
  - `logs` (voice/tap logs per child per day)
  - `subjects` (configurable per child)
  - `rewards` (XP, streaks, badges)
  - `tutor_sessions` (linked child + tutor)
  - `tutor_profiles`
  - `ai_summaries` (cached daily/weekly outputs)
- **Vector DB:** Pinecone (Phase 3 — for insight embeddings and tutor matching)

### 5.4 AI / GenAI Stack
| Function | Tool |
|----------|------|
| Voice → Text | OpenAI Whisper API (or Deepgram for cost) |
| Log structuring | Claude 3.5 Sonnet (Anthropic API) |
| Daily parent summary | Claude 3.5 Haiku (cost-optimised) |
| Weekly insight report | Claude 3.5 Sonnet |
| Tutor recommendation | Claude + Pinecone RAG |
| WhatsApp parsing | Claude 3.5 Haiku via webhook |

**AI Cost Controls:**
- Cache summaries; don't regenerate unless new logs exist
- Rate-limit voice clips to 60s
- Haiku for high-volume, Sonnet for quality outputs

### 5.5 Third-Party Integrations
| Service | Purpose |
|---------|---------|
| Twilio / WhatsApp Business API | Ambient voice logging |
| Amazon Alexa Skills Kit | Alexa integration |
| Google Actions | Google Assistant |
| Razorpay | In-app subscription payments (India) |
| Firebase | FCM push (Android backup) |
| Sentry | Error monitoring |
| LaunchDarkly | Feature flags |

---

## 6. Infrastructure Plan

### 6.1 Cloud Provider: AWS (Primary)
```
Region: ap-south-1 (Mumbai) — India-first latency
```

| Component | Service | Notes |
|-----------|---------|-------|
| Compute | AWS Lambda | Serverless, auto-scale |
| API Layer | API Gateway | REST, throttling |
| DB | Supabase (Postgres) | Hosted, row-level security |
| File Storage | S3 + CloudFront | Audio files, CDN delivery |
| Queue | SQS FIFO | AI processing jobs |
| Cache | Upstash Redis | Session, rate limiting |
| Secrets | AWS Secrets Manager | API keys, DB passwords |
| Monitoring | CloudWatch + Sentry | Logs, alerts, errors |
| CI/CD | GitHub Actions | Test → Build → Deploy |
| Mobile Builds | Expo EAS Build | iOS + Android |
| OTA Updates | Expo EAS Update | JS bundle updates (no store) |

### 6.2 Environments
| Env | Purpose |
|-----|---------|
| `dev` | Local + PR previews |
| `staging` | QA + integration testing |
| `production` | Live users |

### 6.3 Security
- All audio deleted from S3 after AI processing (30-day retention max)
- COPPA/DPDP (India) compliance for child data
- Row-level security in Supabase for all child records
- JWT with short expiry + refresh token rotation
- No PII in logs or analytics

---

## 7. Testing Platform

### 7.1 Unit Testing
- **Framework:** Jest + React Native Testing Library
- **Coverage target:** ≥80% on business logic (AI parsers, reward engine)

### 7.2 Integration Testing
- **API:** Supertest against Lambda handlers
- **DB:** Supabase local dev (Docker)

### 7.3 E2E Testing
- **Framework:** Maestro (React Native E2E, fast setup)
- **Flows:** Login → Log → Reward, Parent summary view, Tutor session log

### 7.4 AI Output Testing
- **Evals:** Custom LLM eval suite (prompt → expected structured output)
- **Tool:** Braintrust or custom eval harness
- **Regression:** Run on every prompt change

### 7.5 Device Testing
- **Platform:** BrowserStack App Automate (real devices)
- **Priority Devices:** Samsung Galaxy A-series, Redmi Note, iPhone SE, iPhone 14

### 7.6 Performance Testing
- **Tool:** k6 (load testing Lambda APIs)
- **Target:** p95 API response < 300ms (excluding AI calls)

### 7.7 Beta Testing
- **Tool:** TestFlight (iOS) + Google Play Internal Track (Android)
- **Beta cohort:** 50 families, 20 tutors — Phase 1 before public launch

---

## 8. Gamification Specification

### 8.1 XP System
| Action | XP Earned |
|--------|-----------|
| Daily log (any method) | +10 XP |
| Full subject log (3+ subjects) | +25 XP |
| Streak day 3 | +15 bonus |
| Streak day 7 | +50 bonus |
| Tutor session logged | +20 XP |
| Parent views summary | +5 XP (child) |

### 8.2 Level Thresholds
| Level | XP Range | Badge |
|-------|----------|-------|
| Explorer | 0–99 | 🌱 |
| Learner | 100–499 | 📚 |
| Scholar | 500–1499 | ⭐ |
| Champion | 1500+ | 🏆 |

### 8.3 Streak Rules
- Streak counts if at least 1 log is submitted before midnight local time
- Grace period: 1 missed day per 7-day window (streak shield)
- Visual: Flame emoji with day counter

---

## 9. Business Model & Revenue Strategy

Master-Kids is designed as a multi-sided platform with eight distinct revenue streams. Rather than relying on a single monetization mechanism, the model is layered: consumer subscription provides the base recurring revenue floor, hardware and marketplace provide high-margin spike revenue, and B2B channels (schools, coaching chains, publishers, CSR) provide large-contract predictability and diversification. The mix shifts across phases as the user base and trust compound.

---

### 9.1 Overview — Revenue Stream Map

| # | Revenue Stream | Phase Active | Revenue Type | Indian Market Fit |
|---|---------------|-------------|-------------|------------------|
| 1 | Freemium Consumer Subscription | Phase 1+ | Recurring MRR | High — Razorpay, UPI, EMI |
| 2 | Hardware Device Sales | Phase 4+ | One-time + bundled sub | High — aspiration goods |
| 3 | Tutor Marketplace Commission | Phase 2+ | Transaction % | High — massive tutor economy |
| 4 | School / Institution SaaS Licensing | Phase 2+ | Annual B2B contract | High — school digitization push |
| 5 | B2B Edtech Data Insights Partnerships | Phase 3+ | API / data licensing | Medium — emerging market |
| 6 | WhatsApp API & Coaching Chain Integration | Phase 1.5+ | SaaS per-seat | High — coaching market is massive |
| 7 | Publisher Sponsored Content & Study Materials | Phase 3+ | Revenue share / CPC | Medium — engaged user base |
| 8 | Corporate CSR Education Partnerships | Phase 2+ | Grant / sponsorship contract | High — CSRA mandated giving |

**Year 1–2 Recommended Primary Mix:** Subscription (50%) + School SaaS (25%) + Marketplace (15%) + Other (10%)
**Year 3+ Recommended Primary Mix:** Subscription (30%) + Hardware (20%) + School SaaS (25%) + Marketplace + Data (25%)

---

### 9.2 Stream 1 — Freemium Consumer Subscription

**Model:** Free tier forever with feature gates. Premium unlocks advanced AI, multi-child, and insights.

**Pricing (INR, Razorpay / UPI):**
| Plan | Price | Billing | Target Segment |
|------|-------|---------|---------------|
| Free | ₹0 | — | Acquisition layer, habit building |
| Premium Monthly | ₹199/month | Monthly | Urban parents, trial converts |
| Premium Annual | ₹1,499/year (₹125/mo) | Annual | Committed users, 25% discount |
| Family Pack (up to 3 children) | ₹2,499/year | Annual | Multi-child households |

**Free Tier includes:**
- 1 child, voice + tap logging
- Basic daily parent summary (push notification)
- XP + streaks + badges
- 7-day log history

**Premium gates:**
- Weekly AI progress report (PDF + in-app)
- Multi-child dashboard (up to 3 children)
- Advanced skill-gap insights
- Extended log history (unlimited)
- Tutor linking + session reports
- Priority AI processing queue

**Projection (conservative):**
| Month | MAU | Free % | Premium % | MRR |
|-------|-----|--------|-----------|-----|
| M6 | 5,000 | 90% | 10% | ₹99,500 |
| M12 | 25,000 | 85% | 15% | ₹747,000 |
| M24 | 100,000 | 80% | 20% | ₹3,980,000 |

**Pros:** Predictable MRR, high LTV, low CAC via virality (parent shares child summary). Razorpay supports UPI mandates and EMI, critical for Indian price sensitivity.

**Cons:** Indian parents resist recurring fees; free-tier churn is high without engagement hooks. Requires strong activation within 7 days.

**Key lever:** WhatsApp-based referral ("Share Arjun's 7-day streak") to drive organic CAC to near zero.

---

### 9.3 Stream 2 — Hardware Device Sales (Phase 4)

**Model:** One-time device sale bundled with 1-year Premium subscription. Hardware creates physical commitment and brand presence in the home.

**Device:** Desk logging device — single button, built-in mic, LED streak ring, BLE to phone app.

**Pricing:**
| SKU | Price | Includes |
|-----|-------|---------|
| Standard Device | ₹1,999 | Device + 6 months Premium |
| Premium Device (color variants) | ₹2,499 | Device + 12 months Premium |
| School Bundle (10 devices) | ₹14,999 | 10 devices + 1-year school license |

**Unit Economics (estimated):**
- BOM (Bill of Materials): ₹600–₹800 per device (contract manufacturing, Shenzhen or Pune SEZ)
- Gross margin per device: 55–65% on hardware alone
- Attached subscription value over 2 years: ₹2,400 LTV
- Combined hardware + sub LTV: ~₹4,500 per household

**Projection:**
| Year | Units Sold | Hardware Revenue | Attached Sub Revenue | Total |
|------|-----------|-----------------|---------------------|-------|
| Y2 | 2,000 | ₹42,00,000 | ₹24,00,000 | ₹66,00,000 |
| Y3 | 10,000 | ₹2,10,00,000 | ₹1,20,00,000 | ₹3,30,00,000 |

**Pros:** Extremely high margin; drives household lock-in; creates a physical brand artifact; opens retail channel (offline modern trade, Croma, school uniform shops).

**Cons:** Hardware is operationally complex (inventory, logistics, returns, firmware support). Capital-intensive to tool and manufacture. Deferred to Phase 4 to validate app habit first.

**Distribution:** Direct (app purchase), Amazon India, Flipkart, B2B school bundles via sales reps.

---

### 9.4 Stream 3 — Tutor Marketplace Commission

**Model:** Two-sided marketplace connecting parents with tutors. Revenue from transaction commission and promoted listings.

**India Context:** India has an estimated 7–10 million home tutors. The vast majority operate without any digital presence or lead generation. Master-Kids is the first platform to tie tutor visibility directly to session quality (logging frequency = activity score = better ranking).

**Revenue mechanisms:**
| Mechanism | Rate | Notes |
|-----------|------|-------|
| Lead commission (first 3 sessions) | 15% per session fee | Charged to tutor |
| Monthly featured listing | ₹499–₹999/month | Tutor pays for top placement |
| Premium tutor verification badge | ₹1,999 one-time | Background check + badge |
| Subscription (Tutor Pro) | ₹299/month | Unlimited leads, analytics |

**Tutor Pro unlocks:**
- Auto-generated session PDFs for parents
- Priority ranking in search
- Monthly performance report
- Lead conversion analytics

**Projection:**
| Month | Active Tutors | Commission Revenue | Listing Revenue | Total MRR |
|-------|--------------|-------------------|----------------|----------|
| M9 | 500 | ₹75,000 | ₹49,000 | ₹1,24,000 |
| M18 | 3,000 | ₹5,00,000 | ₹2,40,000 | ₹7,40,000 |
| M30 | 10,000 | ₹18,00,000 | ₹8,00,000 | ₹26,00,000 |

**Pros:** Network effects compound — more tutors improve parent value, more parents attract more tutors. Commission is payable only on revenue already received (no upfront risk for tutor).

**Cons:** Tutors are price-sensitive; many will resist commission and try to take relationships off-platform. Mitigation: off-platform transactions lose tutor activity score and parent visibility — a strong platform lock-in.

---

### 9.5 Stream 4 — School / Institution SaaS Licensing

**Model:** Annual B2B contract with schools, coaching institutes, and after-school programs. School pays per-student seat; Master-Kids white-labels the parent-facing dashboard with school branding.

**India Context:** Over 1.5 million schools in India. CBSE, ICSE, and state boards are under pressure to demonstrate parent engagement and learning outcomes. NEP 2020 explicitly mandates 360-degree learner assessment — Master-Kids data directly fulfills this.

**Pricing:**
| Tier | Seats | Annual Price | Per-Seat Cost |
|------|-------|-------------|--------------|
| Starter (1 section) | Up to 40 students | ₹15,000/year | ₹375/student |
| School Basic | Up to 200 students | ₹49,999/year | ₹250/student |
| School Pro | Up to 500 students | ₹99,999/year | ₹200/student |
| District / Chain | 500–5,000 students | Custom (₹150–₹175/student) | Negotiated |

**School-specific features:**
- School-branded parent app (white-label)
- Teacher dashboard (aggregate class view)
- Auto-generated end-of-term progress PDFs
- Bulk student onboarding via CSV
- Principal / admin reporting panel
- Integration with existing school ERP (Phase 3)

**Sales motion:** Direct outreach to school principals via education consultants; channel partner referral (school vendors, stationery distributors already trusted by schools).

**Projection:**
| Year | Schools Contracted | Avg Contract Value | ARR |
|------|-------------------|-------------------|-----|
| Y1 | 20 | ₹35,000 | ₹7,00,000 |
| Y2 | 150 | ₹55,000 | ₹82,50,000 |
| Y3 | 500 | ₹75,000 | ₹3,75,00,000 |

**Pros:** High contract value, predictable annual ARR, creates mass user acquisition at near-zero marginal CAC (school mandates the app to all parents). One school = 200+ families onboarded.

**Cons:** Long sales cycles (3–9 months); procurement bureaucracy; payment terms often Net-90; requires dedicated B2B sales resource. Start with progressive schools (Delhi-NCR, Bengaluru, Pune international/CBSE schools).

---

### 9.6 Stream 5 — B2B Edtech Data Insights Partnerships

**Model:** Anonymized, aggregated behavioral data licensed to edtech companies, curriculum publishers, and research institutions. Data is fully anonymized and consent-gated (DPDP compliant). Not PII sales — strictly aggregate behavioral signals.

**What the data reveals:**
- Subject engagement patterns by age group, city, grade
- Dropout patterns correlated with subject/tutor/time-of-day
- Homework completion rates by curriculum type
- Mood/engagement trends over academic year

**Customer segments:**
| Buyer | What They Pay For | Estimated Annual Value |
|-------|-----------------|----------------------|
| Curriculum publishers (NCERT, Pearson, Oxford) | Subject engagement benchmarks | ₹5–15 lakh/year |
| Edtech platforms (BYJU's, Unacademy partners) | Grade × subject churn signals | ₹10–25 lakh/year |
| Academic research institutions (IITs, TIFR) | De-identified longitudinal study datasets | Grant + revenue share |
| Government (State Education Depts.) | District-level learning outcome reports | ₹5–20 lakh/contract |

**Monetization model:** Annual API access subscription or bulk data exports. Revenue scales with DAU — a 100K user base generates meaningfully rich signals worth paying for.

**Revenue projection (Year 3+, post-scale):**
- Year 3: ₹30–60 lakh from 3–5 partners
- Year 4+: ₹1–2 crore from 8–12 partners

**Pros:** Near 100% gross margin (no COGS — data already exists). Does not require additional product investment. Generates recurring, passive income.

**Cons:** Requires rigorous DPDP compliance framework and explicit consent collection. Reputational risk if data practices are perceived as invasive (especially for children). Must never sell individual-level or identifiable data.

**Safeguards:** Opt-in consent during onboarding; data aggregated to cohorts of 100+ minimum; full audit trail; third-party data privacy certification (ISO 27701 target).

---

### 9.7 Stream 6 — WhatsApp API & Coaching Chain Integration

**Model:** White-label Master-Kids' ambient voice logging infrastructure (WhatsApp webhook + AI pipeline) as a B2B SaaS product sold to large coaching chains, after-school centers, and education franchises.

**India Context:** India has thousands of coaching chains (FIITJEE, Aakash, Allen, local city-level chains). They all face the same problem: no structured, low-friction way to communicate session outcomes to parents. Master-Kids' WhatsApp-based logging is a ready solution they can deploy without building it themselves.

**Product offer:**
- Branded WhatsApp Business number with coaching chain's name
- Parent WhatsApp receives auto-generated session notes after each class
- Tutor simply sends a 60-second voice note post-session
- AI structures, translates (Hindi/English), and delivers to parent in <2 minutes

**Pricing:**
| Tier | Students | Monthly SaaS Fee |
|------|---------|-----------------|
| Center Starter | Up to 100 students | ₹4,999/month |
| Chain Basic | Up to 500 students | ₹14,999/month |
| Enterprise Chain | 500–5,000 students | ₹25,000–₹75,000/month |

**Setup fee:** ₹9,999–₹24,999 one-time (integration, onboarding, training)

**Projection:**
| Year | Chains Contracted | Avg MRR/Chain | Total MRR |
|------|------------------|--------------|----------|
| Y2 | 15 | ₹12,000 | ₹1,80,000 |
| Y3 | 60 | ₹18,000 | ₹10,80,000 |

**Pros:** High contract value; minimal incremental infra cost (WhatsApp Twilio costs pass-through); strong stickiness once integrated into tutor workflow. Coaching chains are the fastest-growing segment of the Indian education market.

**Cons:** Sales and onboarding require local sales reps in each city; coaching chains may want to own the branding end-to-end (handle with white-label mode). Twilio WhatsApp API costs must be factored into unit economics.

---

### 9.8 Stream 7 — Publisher Sponsored Content & Curated Study Materials

**Model:** Publishers (textbook, workbook, edtech content) pay for native placement within the Master-Kids app — recommended study materials, practice worksheets, and guided reading lists surfaced contextually based on child's logged subjects and grade.

**India Context:** India's K-12 supplementary materials market is worth ₹8,000+ crore annually. Publishers (S Chand, Navneet, Oxford India, Pearson) spend significant budgets on school-channel marketing but have no direct digital relationship with parents.

**Revenue mechanisms:**
| Format | Pricing |
|--------|---------|
| "Recommended for [Subject]" placement | ₹2–5 CPC (cost per click to publisher product page) |
| "Practice set of the week" (branded) | ₹50,000–₹1,50,000 per campaign per month |
| Curated study pack (in-app purchase, rev share) | 30% of ₹49–₹199 per pack |
| Subject-based push notification (1x/week, labeled sponsored) | ₹1,00,000 per 50K impressions |

**Guardrails:**
- Only shown to parents (never to children in child-facing screens)
- Clearly labeled "Recommended resource" or "Sponsored"
- Relevance-gated: only shown when subject matches recent child log
- Max 1 sponsored touchpoint per day per parent

**Projection (Year 3, 100K+ MAU):**
- 3–5 publisher partners: ₹15–40 lakh/year
- In-app study pack purchases: ₹10–20 lakh/year
- **Total: ₹25–60 lakh/year**

**Pros:** Highly contextual placement = high publisher ROI = strong advertiser retention. No intrusive advertising; content is genuinely useful to parents. Scales passively with user base.

**Cons:** Requires content curation and quality control team. Risk of parent trust erosion if placements feel pushy. Must be introduced carefully after Year 2 when trust is established.

---

### 9.9 Stream 8 — Corporate CSR Education Partnerships

**Model:** Indian corporations with mandatory CSR budgets (Companies Act 2013, Schedule VII: Education) sponsor Master-Kids access for underserved communities — government school children, Tier 2/3 city families, NGO partner beneficiaries.

**India Context:** Indian companies with net profit >₹5 crore must spend 2% on CSR. Education is the #1 approved CSR category. CSR budgets across India total over ₹26,000 crore/year. Edtech platforms are increasingly the preferred vehicle because CSR committees can quantify impact (children enrolled, logs submitted, parents engaged).

**Structure:**
| Partnership Type | How It Works | Revenue to Master-Kids |
|-----------------|-------------|----------------------|
| Sponsored access grant | Corp pays for 1,000–10,000 Premium seats for target beneficiary families | ₹125–₹199 per seat/year (bulk rate) |
| Co-branded impact program | "Reliance Foundation x Master-Kids Learning Drive" | Flat contract ₹10–50 lakh |
| School adoption program | Corp sponsors 5–20 schools (full school license) | ₹15,000–₹99,999 per school/year |
| Impact measurement report | Annual CSR impact report (children reached, logs, engagement data) | ₹1–3 lakh additional for reporting |

**Target CSR partners:**
- Large conglomerates with education CSR mandates (Tata Trusts, Reliance Foundation, Infosys Foundation, HCL Foundation, Wipro Foundation)
- PSU banks (State Bank of India, Bank of Baroda — education scheme mandates)
- FMCG companies targeting families (HUL, Dabur, Nestle India)
- Mid-size IT companies (₹500Cr+ revenue, looking for scalable CSR vehicles)

**Deal timeline:** 3–6 month sales cycle; typically tied to corporate financial year (April–March in India). CSR committees approve in Q3/Q4.

**Projection:**
| Year | Active CSR Partners | Annual Revenue |
|------|---------------------|---------------|
| Y2 | 3 | ₹30,00,000 |
| Y3 | 8 | ₹1,00,00,000 |
| Y4 | 15 | ₹2,50,00,000 |

**Pros:** Non-dilutive, grant-like revenue with minimal sales cost once trust is established. CSR deals often renew automatically if impact metrics are met. Provides mission credibility and press coverage.

**Cons:** Lumpy revenue (annual cycles); relationship-driven sales (needs a BD hire with CSR network); impact reporting adds operational overhead. CSR deals can be paused if corporate earnings fall.

---

### 9.10 Recommended Revenue Mix by Year

| Stream | Y1 Target | Y2 Target | Y3 Target |
|--------|-----------|-----------|-----------|
| 1. Consumer Subscription | ₹36L | ₹2.4Cr | ₹9.6Cr |
| 2. Hardware Sales | — | ₹66L | ₹3.3Cr |
| 3. Tutor Marketplace | ₹6L | ₹90L | ₹3.1Cr |
| 4. School SaaS | ₹7L | ₹82L | ₹3.75Cr |
| 5. Data Insights | — | — | ₹45L |
| 6. Coaching Chain WhatsApp SaaS | — | ₹21L | ₹1.3Cr |
| 7. Publisher Sponsored Content | — | ₹10L | ₹42L |
| 8. Corporate CSR | — | ₹30L | ₹1Cr |
| **Total** | **~₹49L** | **~₹5.4Cr** | **~₹23Cr** |

All figures in INR. Crore = 10 million INR. L = lakh = 100,000 INR.

---

### 9.11 Unit Economics Summary

| Metric | Target |
|--------|--------|
| Consumer CAC (organic) | ₹0–₹150 |
| Consumer CAC (paid) | ₹300–₹600 |
| Consumer LTV (Premium Annual) | ₹2,500–₹4,000 over 2 years |
| LTV:CAC ratio target | ≥5:1 |
| Gross Margin (Subscription) | 75–82% |
| Gross Margin (Hardware) | 55–65% |
| Gross Margin (B2B SaaS) | 70–78% |
| Gross Margin (Marketplace) | 85%+ |
| Payback period (Consumer) | 8–14 months |
| Payback period (School SaaS) | 6–9 months |

---

## 10. Notification Strategy

| Notification | Trigger | Channel |
|-------------|---------|---------|
| "Time to log!" | 6 PM daily (configurable) | Push |
| "Arjun's daily summary is ready" | After AI processing | Push |
| "🔥 5-day streak! Keep it going" | Streak milestone | Push |
| "Session logged by [Tutor Name]" | Tutor logs session | Push |
| Weekly report ready | Every Sunday 9 AM | Push + in-app |

---

## 11. Accessibility & Localization

- **Languages (Phase 1):** English
- **Languages (Phase 2):** Hindi
- **Font size:** Dynamic type support (iOS) + scalable text (Android)
- **Voice recognition language:** English + Hindi (Whisper supports both)
- **Accessibility:** VoiceOver / TalkBack compatible for parent dashboard

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Logging fatigue in kids | High | High | <10s UX, rewards, ambient input |
| Tutor adoption resistance | Medium | High | Lead gen incentive, auto-reporting |
| AI hallucinations in summaries | Medium | Medium | Structured prompts, human-readable output validation |
| Privacy concerns (child data) | Low | High | DPDP compliance, data minimization |
| Hardware distraction | Medium | Low | Introduce only after habit validated |
| App store rejection (kids category) | Low | High | Follow COPPA/CIPA guidelines strictly |

---

## 13. Definition of Done (per Phase)

### Phase 1 DoD
- [ ] Voice log → AI parse → structured record working
- [ ] Parent summary generated and delivered via push
- [ ] Reward system (XP + streaks) functional
- [ ] iOS + Android builds on TestFlight / Play Internal
- [ ] 80% unit test coverage on core modules
- [ ] 50 beta families onboarded
- [ ] ≥40% log 3×/week in Week 4

---

*Document Owner: Product Team | Next Review: Post Phase 1 Beta*
