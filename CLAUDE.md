# CLAUDE.md — Master-Kids Project Context

> This file is the single source of truth for Claude Code.
> Read this fully before writing any code, suggesting any architecture, or making any decisions.

---

## ⚠️ Revamp in progress (2026-06-22)

The product is being revamped **child-centric** per `Change request.docx`. The live implementation
is **web-first on Azure**, not the original AWS / React-Native plan. The current blueprint lives in
`docs/`:
- `docs/ARCHITECTURE.md` — target architecture + scale path to 1M users
- `docs/DATA_MODEL.md` — Supabase/Postgres schema + RLS for all modules
- `docs/MODULES.md` — the 13 modules synthesized from the Change Request (scope per module)
- `docs/AZURE_COST.md` — cost model (target < $10/mo) + scaling cost path

**When `docs/` and the sections below disagree, `docs/` wins.** The single production client today
is `apps/web` (React + Vite on Azure Static Web Apps). The native mobile (Expo) track and the AWS
plan below are deferred/historical. Locked decisions: Supabase free tier as backend, one
consolidated web app, Azure SWA hosting, target running cost < $10/mo at MVP.

---

## What This Product Is

**Master-Kids** is a habit-forming daily progress tracking app for children (ages 5–14), built for the Indian market. It is a three-sided platform: Parents, Children, and Tutors.

**One-line clarity:**
> "Kids log their day in 10 seconds. Parents instantly know if they're improving."

**Core philosophy:** The real problem is not lack of tools — it's lack of consistency and visibility. The product solves this with a Daily Progress Loop:
- Low-friction input (voice / tap / ambient)
- AI-structured output (summaries, insights)
- Reward-driven engagement (XP, streaks, badges)

---

## Tech Stack — Locked Decisions

| Layer | Choice | Reason |
|-------|--------|--------|
| **Primary client** | **Web — React 19 + Vite (PWA)** | One codebase, instant deploy, installable; native mobile is a later track |
| Native mobile (later) | React Native + Expo | Deferred — web PWA covers the MVP |
| Navigation | React Router v6 (web) | File/route-based |
| State | Zustand (local) + React Query (server) | Lightweight, no boilerplate |
| Styling | Tailwind CSS + framer-motion | Design tokens + motion (flip cards, etc.) |
| Backend / API | **Azure Static Web Apps managed Functions** (Node) | Serverless, $0 idle, scale-to-zero; secrets server-side only |
| Hosting | **Azure Static Web Apps (Free tier)** | Web + API + global CDN + SSL at $0 |
| Auth | Supabase Auth | Phone OTP + JWT, RLS built-in |
| Database | **PostgreSQL via Supabase (Free tier)** | Row-level security, per-account isolation |
| File storage | Supabase Storage → Azure Blob at scale | Photos, certificates, digital-book pages |
| Cache (at scale) | Upstash Redis | Serverless Redis, rate limiting |
| Queue (at scale) | Azure Service Bus → worker | Async AI processing, non-blocking |
| STT | OpenAI Whisper API (or Deepgram) | Supports English + Hindi |
| AI Structuring | Claude Haiku (Anthropic API) | High-volume, cost-optimised |
| AI Summaries | Claude Sonnet (Anthropic API) | Quality parent summaries |
| AI Insights | Claude Sonnet + Pinecone RAG | Weekly reports (Phase 3+) |
| Vector DB | Pinecone | Embeddings for tutor matching (Phase 3) |
| Payments | Razorpay | India-first, UPI + cards |
| Push Notifications | Expo Notifications → FCM + APNs | Cross-platform |
| Analytics | PostHog | Self-hostable, privacy-first |
| Error Tracking | Sentry | Crash reports, performance |
| Feature Flags | LaunchDarkly | Gradual rollouts |
| CI/CD | GitHub Actions | Test → Build → Deploy |
| Mobile Builds | Expo EAS Build | Cloud iOS + Android builds |
| OTA Updates | Expo EAS Update | Push JS updates without store |
| Unit Testing | Jest + React Native Testing Library | 80% coverage target |
| E2E Testing | Maestro | Simpler than Detox for RN |
| Device Testing | BrowserStack App Automate | Real devices |
| AI Evals | Braintrust | LLM output regression testing |
| Load Testing | k6 | Lambda API performance |
| WhatsApp | Twilio WhatsApp Business API | Ambient voice logging |
| Cloud Region | Azure Central India (Pune) / South India | India-first latency |
| AI (today) | OpenAI `gpt-4o-mini` via SWA Function `/api/chat` | In place now; migrate to Claude Haiku/Sonnet per rows above |

---

## Repository Structure

```
master-kids/
├── CLAUDE.md                   ← You are here
├── apps/
│   └── mobile/                 ← React Native (Expo) app
│       ├── app/                ← Expo Router file-based routing
│       │   ├── (auth)/         ← Login, OTP screens
│       │   ├── (parent)/       ← Parent dashboard, settings
│       │   ├── (child)/        ← Child log, rewards, dashboard
│       │   └── (tutor)/        ← Tutor session log, profile
│       ├── components/         ← Shared UI components
│       ├── hooks/              ← Custom React hooks
│       ├── stores/             ← Zustand stores
│       ├── services/           ← API calls (React Query)
│       ├── utils/              ← Helpers, formatters
│       └── constants/          ← Colors, sizes, routes
├── apps/
│   └── backend/                ← Hono.js on AWS Lambda
│       ├── src/
│       │   ├── routes/         ← API route handlers
│       │   ├── services/       ← Business logic
│       │   ├── ai/             ← AI pipeline (STT, structuring, summary)
│       │   ├── db/             ← Supabase client + queries
│       │   ├── queue/          ← SQS producer/consumer
│       │   └── middleware/     ← Auth, rate limit, validation
│       └── tests/              ← Unit + integration tests
├── packages/
│   └── shared/                 ← Shared types, constants (TypeScript)
├── supabase/
│   ├── migrations/             ← Database schema migrations
│   └── seed.sql                ← Dev seed data
├── infra/                      ← AWS CDK or Serverless Framework config
└── .github/
    └── workflows/              ← CI/CD pipelines
```

---

## Database Schema

All tables live in Supabase PostgreSQL with Row Level Security enabled.

```sql
-- Users (parents, tutors — role-based)
users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text UNIQUE,
  role text CHECK (role IN ('parent', 'tutor')),
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
)

-- Children (linked to parent)
children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES users(id),
  name text NOT NULL,
  age integer,
  avatar_url text,
  grade text,
  created_at timestamptz DEFAULT now()
)

-- Subjects (configurable per child)
subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  name text NOT NULL,
  icon text,
  is_active boolean DEFAULT true
)

-- Daily Logs (voice or tap, one per child per entry)
logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  logged_by text CHECK (logged_by IN ('child', 'tutor', 'parent')),
  input_type text CHECK (input_type IN ('voice', 'tap', 'whatsapp', 'alexa')),
  raw_transcript text,
  structured jsonb,    -- {subjects: [], activities: [], duration_mins: int, mood: string}
  audio_s3_key text,
  logged_at timestamptz DEFAULT now()
)

-- AI Summaries (cached, regenerated only on new logs)
ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  summary_type text CHECK (summary_type IN ('daily', 'weekly')),
  content text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  date date NOT NULL,
  UNIQUE(child_id, summary_type, date)
)

-- Rewards (XP and badge ledger)
rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  xp_total integer DEFAULT 0,
  level text DEFAULT 'Explorer',
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_logged_date date,
  updated_at timestamptz DEFAULT now()
)

-- Badges
badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  badge_key text NOT NULL,
  earned_at timestamptz DEFAULT now()
)

-- Tutor Sessions
tutor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES users(id),
  child_id uuid REFERENCES children(id),
  raw_transcript text,
  structured jsonb,    -- {topics: [], homework: [], parent_notes: string}
  audio_s3_key text,
  session_date date,
  created_at timestamptz DEFAULT now()
)

-- Tutor Profiles
tutor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES users(id) UNIQUE,
  subjects text[],
  bio text,
  experience_years integer,
  activity_score integer DEFAULT 0,
  rating numeric(3,2),
  is_top_coach boolean DEFAULT false,
  location text
)
```

---

## User Personas (Always Keep In Mind)

### Parent
- Wants visibility without doing data entry
- Checks the app once a day, typically evening
- Key touchpoint: push notification → daily summary deep link

### Child (5–14)
- Low patience — any log action must be ≤10 seconds
- Motivated by rewards and streaks
- Tap or speak, never type

### Tutor
- Avoids admin work
- Motivated by leads, discovery visibility, and credibility
- Voice logs session at the end of class

---

## XP & Gamification Rules

| Action | XP |
|--------|----|
| Any log submitted | +10 |
| 3+ subjects logged in one day | +25 |
| Streak day 3 | +15 bonus |
| Streak day 7 | +50 bonus |
| Tutor session logged | +20 |
| Parent opens daily summary | +5 (credited to child) |

| Level | XP Range |
|-------|----------|
| Explorer 🌱 | 0–99 |
| Learner 📚 | 100–499 |
| Scholar ⭐ | 500–1499 |
| Champion 🏆 | 1500+ |

**Streak rules:** At least 1 log before midnight local time. Grace period: 1 missed day per 7-day window (streak shield item).

---

## AI Pipeline — How It Works

```
Child speaks (≤60s) → S3 upload → SQS message
    → Lambda consumer
        → Whisper API (audio → transcript)
        → Claude Haiku (transcript → structured JSON)
        → Save to logs table
        → Trigger summary generation (if needed)
            → Claude Sonnet (logs → parent summary text)
            → Save to ai_summaries table
            → Send push notification to parent
```

**Structured log JSON shape:**
```json
{
  "subjects": ["Math", "English"],
  "activities": ["completed homework", "read 10 pages"],
  "duration_mins": 45,
  "mood": "happy",
  "raw_summary": "Arjun finished his math worksheet and read for 30 minutes"
}
```

**Claude Haiku prompt pattern (log structuring):**
```
You are a structured data extractor for a children's education app.
Given a voice transcript from a child about their study session, extract:
- subjects (array of subject names)
- activities (array of short activity descriptions)
- duration_mins (estimated total study time as integer, null if unknown)
- mood (one of: happy, neutral, tired, excited, null)
- raw_summary (one sentence summary in third person)

Respond ONLY with valid JSON. No explanation. No markdown.

Transcript: "{transcript}"
```

**Cost control rules:**
- Cache ai_summaries — never regenerate if no new logs since last generation
- Delete audio from S3 after processing (keep for max 30 days)
- Use Haiku for structuring (high volume), Sonnet for summaries (quality)

---

## Notification Strategy

| Notification | Trigger | Channel |
|-------------|---------|---------|
| "Time to log!" | 6 PM daily (configurable per parent) | Push |
| "Arjun's summary is ready" | After AI processing | Push |
| "🔥 5-day streak!" | Streak milestone | Push |
| "Session logged by [Tutor]" | Tutor session saved | Push |
| Weekly report ready | Sunday 9 AM | Push + in-app |

---

## Phase Plan

### Phase 1 — Daily Engine (Month 0–2) ← CURRENT PHASE
- Voice homework logging
- Tap-based quick log
- AI parent daily summary (push notification)
- XP + streaks + badges
- Child dashboard
- Parent dashboard
- **Success:** ≥40% users log 3×/week, parent open rate ≥50%

### Phase 1.5 — Ambient Layer (Month 2–4)
- WhatsApp voice webhook (Twilio)
- Alexa Skill
- Google Assistant Action
- Tablet kid-mode UI

### Phase 2 — Tutor Layer (Month 4–6)
- Tutor voice session logging
- Auto-generated session notes
- Tutor profile + activity score
- Basic tutor discovery for parents

### Phase 3 — Intelligence Layer (Month 6–9)
- Weekly AI progress report (Premium)
- Consistency + skill gap score
- Pinecone RAG pipeline
- Premium subscription (₹149–₹299/month via Razorpay)

### Phase 4 — Hardware Layer (Month 9–15)
- BLE desk device (one button + voice + LED streak ring)
- Device pairing in app
- OTA firmware updates
- ₹1,999–₹2,999 device + bundled subscription

### Phase 5 — Marketplace (Month 12+)
- AI-based tutor matching
- Lead generation fees
- Featured tutor listings

---

## Environments

| Env | Purpose |
|-----|---------|
| `dev` | Local development + PR previews |
| `staging` | QA + integration testing |
| `production` | Live users |

---

## Code Conventions

- **Language:** TypeScript everywhere (strict mode)
- **Formatting:** Prettier with default config
- **Linting:** ESLint with react-native + typescript rules
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **API responses:** Always `{ data, error, meta }` shape
- **Error handling:** Never swallow errors silently — always log to Sentry
- **Secrets:** Never hardcode. Use `.env` locally, AWS Secrets Manager in production
- **Tests:** Co-locate test files (`Component.test.tsx` next to `Component.tsx`)
- **Commits:** Conventional commits format (`feat:`, `fix:`, `chore:`)

---

## Security & Compliance

- All child data isolated via Supabase Row Level Security
- Parent can only read their own children's data
- Tutor can only read sessions they created
- Audio files deleted after AI processing (30-day max retention)
- DPDP (India Digital Personal Data Protection Act) compliance required
- COPPA guidelines followed for child-facing screens
- JWT short expiry (15 min) + refresh token rotation
- No PII in logs, analytics events, or error reports

---

## Key Files to Know

- `apps/mobile/app/_layout.tsx` — Root layout, auth gate
- `apps/mobile/stores/authStore.ts` — Supabase auth session
- `apps/mobile/services/logService.ts` — Log submission API calls
- `apps/backend/src/ai/pipeline.ts` — STT → structuring → summary chain
- `apps/backend/src/routes/logs.ts` — Log CRUD endpoints
- `supabase/migrations/` — All schema changes go here as migrations

---

## How To Start Each Session With Claude Code

Always begin with:
> "We are building Master-Kids. Read CLAUDE.md. We are currently in [Phase X]. Today's task is [specific feature]."

This ensures full context is loaded before any code is written.
