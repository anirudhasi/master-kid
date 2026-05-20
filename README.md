# Master-Kids

> **"Kids log their day in 10 seconds. Parents instantly know if they're improving."**

Master-Kids is a habit-forming daily progress tracking platform for children aged 5–14, built for the Indian market. It is a three-sided platform connecting **Parents**, **Children**, and **Tutors** through a frictionless daily logging loop powered by AI.

---

## Table of Contents

- [What This Product Solves](#what-this-product-solves)
- [Current Build Status](#current-build-status)
- [Product Roadmap](#product-roadmap)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [AI Pipeline](#ai-pipeline)
- [Gamification System](#gamification-system)
- [User Personas](#user-personas)
- [Notification Strategy](#notification-strategy)
- [Security & Compliance](#security--compliance)
- [Local Development](#local-development)
- [Deployment — Azure](#deployment--azure)
- [CI/CD Pipeline](#cicd-pipeline)
- [Code Conventions](#code-conventions)
- [Environments](#environments)

---

## What This Product Solves

The real problem is not a lack of educational tools — it is a lack of **consistency and visibility**.

- Parents don't know what their child actually studied today
- Children lose motivation without feedback loops and rewards
- Tutors waste time writing session notes manually

Master-Kids solves this with a **Daily Progress Loop**:

```
Child logs in 10 seconds (voice / tap / WhatsApp)
        ↓
AI structures the entry and generates a parent summary
        ↓
Parent gets a push notification with the full daily summary
        ↓
Child earns XP, streaks, and badges → stays consistent
```

---

## Current Build Status

| App | Status | Notes |
|-----|--------|-------|
| **Web App** | ✅ Live on GitHub, deploying to Azure | Full-featured React/Vite dashboard — parent, child, tutor views |
| **Mobile App** | 🔧 Scaffold only | Expo Router structure exists; feature build starts after backend |
| **Backend API** | 📋 Planned — Phase A | Hono.js on AWS Lambda; Supabase auth + DB |
| **AI Pipeline** | ✅ Partial | Miko AI tutor live (OpenAI GPT-4o Mini); full voice pipeline planned |

### Web App — Features Completed

- Multi-user auth with per-phone account isolation (offline OTP for beta)
- Parent onboarding with photo upload, child profile creation
- Child onboarding: grade, board, school, subjects (CBSE/ICSE/IB/State), olympiad interests
- Kid Dashboard: XP, streaks, badges, quick log, recent activity
- Parent Dashboard: child progress overview, subject breakdown, analytics
- Syllabus Tracker: chapter-by-chapter progress per subject
- Weekly Schedule: study block planner with override
- Worksheets: generate and submit worksheets
- Olympiad Explorer: browse and register for competitions
- Social Feed: achievements, badges, community activity
- AI Tutor (Miko): chat powered by GPT-4o Mini, knows the child's curriculum and goal
- Resources / Worksheet Library
- Fun Hub: books, toys, sports, riddles, poems, mind games
- Blog & Articles
- Daily Digest: WhatsApp-style content recommendations
- Tutor Portal: session logging, notes, profile

---

## Product Roadmap

### Phase 1 — Daily Engine ← Current
_Month 0–2_

- [x] Voice / tap-based log in ≤10 seconds
- [x] AI parent daily summary
- [x] XP + streaks + badges + levels
- [x] Child dashboard
- [x] Parent dashboard
- [ ] Real backend (Supabase + Lambda)
- [ ] Real SMS OTP auth
- [ ] Push notifications

**Success metric:** ≥40% of users log 3×/week, parent open rate ≥50%

### Phase 1.5 — Ambient Layer
_Month 2–4_

- WhatsApp voice webhook (Twilio)
- Alexa Skill
- Google Assistant Action
- Tablet kid-mode UI

### Phase 2 — Tutor Layer
_Month 4–6_

- Tutor voice session logging
- Auto-generated session notes
- Tutor profile + activity score
- Basic tutor discovery for parents

### Phase 3 — Intelligence Layer
_Month 6–9_

- Weekly AI progress report (Premium)
- Consistency + skill gap score
- Pinecone RAG pipeline for personalised insights
- Premium subscription: ₹149–₹299/month via Razorpay

### Phase 4 — Hardware Layer
_Month 9–15_

- BLE desk device (one button + voice + LED streak ring)
- Device pairing in app
- OTA firmware updates
- ₹1,999–₹2,999 device + bundled subscription

### Phase 5 — Marketplace
_Month 12+_

- AI-based tutor matching
- Lead generation fees
- Featured tutor listings

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| **Web App** | React 19 + Vite + TypeScript | Fast builds, HMR, strict typing |
| **Styling** | Tailwind CSS + Framer Motion | Design tokens + animations |
| **Mobile** | React Native + Expo (managed) | Single codebase iOS + Android, OTA updates |
| **Navigation (mobile)** | React Navigation v6 | Stack + bottom tabs |
| **State** | Zustand (local) + React Query (server) | Lightweight, no boilerplate |
| **Backend** | Node.js + TypeScript + Hono.js | Edge-compatible, lightweight |
| **Hosting (web)** | Azure Static Web Apps | Free tier, built-in CI/CD, global CDN |
| **Hosting (API)** | AWS Lambda (serverless) | Auto-scale, pay-per-use |
| **API Gateway** | AWS API Gateway (REST) | Throttling, auth middleware |
| **Auth** | Supabase Auth | OTP/SMS + Google OAuth, RLS built-in |
| **Database** | PostgreSQL via Supabase | Row-level security for child data |
| **Cache** | Upstash Redis | Serverless Redis, rate limiting |
| **Storage** | AWS S3 + CloudFront | Audio files, CDN delivery |
| **Queue** | AWS SQS FIFO → Lambda | Async AI processing, non-blocking |
| **STT** | OpenAI Whisper API | Supports English + Hindi |
| **AI Tutor** | OpenAI GPT-4o Mini | Fast, cost-effective chat |
| **AI Structuring** | Claude Haiku (Anthropic) | High-volume log structuring |
| **AI Summaries** | Claude Sonnet (Anthropic) | Quality parent summaries |
| **AI Insights** | Claude Sonnet + Pinecone RAG | Weekly reports (Phase 3+) |
| **Vector DB** | Pinecone | Embeddings for tutor matching |
| **Payments** | Razorpay | India-first, UPI + cards |
| **Push Notifications** | Expo Notifications → FCM + APNs | Cross-platform |
| **Analytics** | PostHog | Self-hostable, privacy-first |
| **Error Tracking** | Sentry | Crash reports, performance |
| **Feature Flags** | LaunchDarkly | Gradual rollouts |
| **CI/CD** | GitHub Actions | Test → Build → Deploy |
| **Mobile Builds** | Expo EAS Build | Cloud iOS + Android builds |
| **OTA Updates** | Expo EAS Update | Push JS updates without app store |
| **Unit Testing** | Jest + React Native Testing Library | 80% coverage target |
| **E2E Testing** | Maestro | Simpler than Detox for RN |
| **AI Evals** | Braintrust | LLM output regression testing |
| **Load Testing** | k6 | Lambda API performance |
| **WhatsApp** | Twilio WhatsApp Business API | Ambient voice logging |
| **Cloud Region** | AWS ap-south-1 (Mumbai) | India-first latency |

---

## Repository Structure

```
master-kids/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml   ← CI/CD: auto-deploy on push to main
├── apps/
│   ├── web/                            ← React + Vite web dashboard (LIVE)
│   │   ├── api/                        ← Azure Functions (OpenAI secure proxy)
│   │   │   └── chat/
│   │   │       ├── function.json
│   │   │       └── index.js
│   │   ├── public/
│   │   │   └── staticwebapp.config.json ← Azure SWA routing config
│   │   ├── src/
│   │   │   ├── components/             ← Sidebar, Navbar, RequireAuth
│   │   │   ├── data/                   ← Static content (blogs, worksheets, fun)
│   │   │   ├── hooks/                  ← useKidStore, custom hooks
│   │   │   ├── pages/                  ← All page components
│   │   │   └── store/                  ← Zustand stores (auth, app, kidsData)
│   │   ├── vite.config.ts
│   │   └── package.json
│   ├── mobile/                         ← React Native + Expo (scaffold)
│   │   ├── app/                        ← Expo Router file-based routing
│   │   │   ├── (tabs)/                 ← Home, child, parent, tutor tabs
│   │   │   └── _layout.tsx
│   │   └── stores/                     ← appStore, auth, openai, supabase stubs
│   └── backend/                        ← Python FastAPI (prototype, to be replaced)
├── packages/
│   └── shared/                         ← Shared TypeScript types
├── CLAUDE.md                           ← AI coding assistant context file
└── README.md                           ← This file
```

---

## Architecture Overview

### Current (Beta / Phase 1)

```
Browser → Azure Static Web Apps (CDN)
             ├── /api/chat → Azure Function → OpenAI API
             └── /* → React SPA (index.html)

Auth: Zustand + localStorage (per-phone isolation)
Data: Zustand persist (localStorage, per-device)
```

### Target (Production / Phase 2+)

```
Mobile App ──────────────────────────────────────────────┐
Web App ─────────────────────────────────────────────────┤
                                                          ↓
                                              AWS API Gateway
                                                    ↓
                                             Lambda Functions
                                            /      |       \
                                    Auth (JWT)  Business   AI Pipeline
                                        |        Logic          |
                                   Supabase     Supabase    SQS Queue
                                    Auth          DB            |
                                                           Lambda Consumer
                                                           /         \
                                                      Whisper      Claude Haiku
                                                      (STT)      (structuring)
                                                                      |
                                                              Claude Sonnet
                                                              (parent summary)
                                                                      |
                                                            Push Notification
                                                               (FCM/APNs)
```

---

## Database Schema

All tables in Supabase PostgreSQL with Row Level Security (RLS) enabled. Parents can only read their children's data. Tutors can only read sessions they created.

```sql
-- Users (parents and tutors)
users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text UNIQUE,
  phone        text UNIQUE,
  role         text CHECK (role IN ('parent', 'tutor')),
  name         text,
  avatar_url   text,
  created_at   timestamptz DEFAULT now()
)

-- Children (linked to parent)
children (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid REFERENCES users(id),
  name         text NOT NULL,
  age          integer,
  avatar_url   text,
  grade        text,
  created_at   timestamptz DEFAULT now()
)

-- Subjects per child
subjects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     uuid REFERENCES children(id),
  name         text NOT NULL,
  icon         text,
  is_active    boolean DEFAULT true
)

-- Daily Logs
logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         uuid REFERENCES children(id),
  logged_by        text CHECK (logged_by IN ('child', 'tutor', 'parent')),
  input_type       text CHECK (input_type IN ('voice', 'tap', 'whatsapp', 'alexa')),
  raw_transcript   text,
  structured       jsonb,   -- { subjects, activities, duration_mins, mood, raw_summary }
  audio_s3_key     text,
  logged_at        timestamptz DEFAULT now()
)

-- AI Summaries (cached — never regenerated if no new logs)
ai_summaries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id       uuid REFERENCES children(id),
  summary_type   text CHECK (summary_type IN ('daily', 'weekly')),
  content        text NOT NULL,
  generated_at   timestamptz DEFAULT now(),
  date           date NOT NULL,
  UNIQUE(child_id, summary_type, date)
)

-- XP and streak ledger
rewards (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         uuid REFERENCES children(id),
  xp_total         integer DEFAULT 0,
  level            text DEFAULT 'Explorer',
  current_streak   integer DEFAULT 0,
  longest_streak   integer DEFAULT 0,
  last_logged_date date,
  updated_at       timestamptz DEFAULT now()
)

-- Badge ledger
badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    uuid REFERENCES children(id),
  badge_key   text NOT NULL,
  earned_at   timestamptz DEFAULT now()
)

-- Tutor Sessions
tutor_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id       uuid REFERENCES users(id),
  child_id       uuid REFERENCES children(id),
  raw_transcript text,
  structured     jsonb,   -- { topics, homework, parent_notes }
  audio_s3_key   text,
  session_date   date,
  created_at     timestamptz DEFAULT now()
)

-- Tutor Profiles
tutor_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id          uuid REFERENCES users(id) UNIQUE,
  subjects          text[],
  bio               text,
  experience_years  integer,
  activity_score    integer DEFAULT 0,
  rating            numeric(3,2),
  is_top_coach      boolean DEFAULT false,
  location          text
)
```

---

## AI Pipeline

### Voice Log Flow

```
Child speaks (≤60s)
    → Upload audio → AWS S3
    → Push message → SQS FIFO
    → Lambda consumer picks up
        → OpenAI Whisper API (audio → transcript)
        → Claude Haiku (transcript → structured JSON)
        → Save structured log → Supabase logs table
        → If new logs since last summary:
            → Claude Sonnet (last 7 logs → parent summary text)
            → Save → ai_summaries table (with UNIQUE constraint — no duplicates)
            → Expo Push → FCM/APNs → parent's phone
```

### Structured Log JSON Shape

```json
{
  "subjects":     ["Math", "English"],
  "activities":   ["completed homework", "read 10 pages"],
  "duration_mins": 45,
  "mood":         "happy",
  "raw_summary":  "Arjun finished his math worksheet and read for 30 minutes"
}
```

### Claude Haiku Prompt (Log Structuring)

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

### AI Cost Controls

- Cache `ai_summaries` — never regenerate if no new logs since last generation
- Delete audio from S3 after Whisper processing (retain max 30 days)
- Claude Haiku for structuring (high volume, low cost)
- Claude Sonnet for parent summaries (quality matters)
- GPT-4o Mini for Miko AI tutor chat (fast, cheap, accurate)

---

## Gamification System

### XP Rewards

| Action | XP Earned |
|--------|-----------|
| Any log submitted | +10 |
| 3+ subjects in one day | +25 bonus |
| Streak milestone: day 3 | +15 bonus |
| Streak milestone: day 7 | +50 bonus |
| Tutor session logged | +20 |
| Parent opens daily summary | +5 (credited to child) |

### Levels

| Level | XP Range |
|-------|----------|
| Explorer 🌱 | 0 – 99 |
| Learner 📚 | 100 – 499 |
| Scholar ⭐ | 500 – 1499 |
| Champion 🏆 | 1500+ |

### Streak Rules

- Minimum: 1 log before midnight local time to keep streak alive
- Grace period: 1 missed day per 7-day window (streak shield item)
- Longest streak tracked separately from current streak

---

## User Personas

### Parent
- Wants visibility without doing any data entry themselves
- Checks the app once a day, typically in the evening
- Primary touchpoint: push notification → daily summary deep link
- Decision maker for subscription upgrade

### Child (ages 5–14)
- Low patience — any logging action must take ≤10 seconds
- Motivated by rewards, streaks, and public badges
- Interface: tap or speak, never type long text
- Younger kids (5–8): parent-assisted logging

### Tutor
- Actively avoids admin work
- Motivated by leads, client discovery, and credibility signals
- Logs session in voice at the end of class (≤30 seconds)
- Benefits: activity score improves discovery ranking

---

## Notification Strategy

| Notification | Trigger | Channel |
|-------------|---------|---------|
| "Time to log!" | 6 PM daily (parent-configurable) | Push |
| "Arjun's summary is ready" | After AI processing completes | Push |
| "🔥 5-day streak!" | Streak milestone reached | Push |
| "Session logged by [Tutor Name]" | Tutor session saved | Push |
| Weekly progress report ready | Sunday 9 AM | Push + in-app |

---

## Security & Compliance

- **Row Level Security (RLS):** All Supabase tables — parents access only their children's data, tutors access only their sessions
- **JWT:** Short expiry (15 min) + refresh token rotation
- **Audio retention:** Deleted from S3 after AI processing, maximum 30-day retention
- **DPDP compliance:** India Digital Personal Data Protection Act — no unnecessary PII collection
- **COPPA guidelines:** Followed for all child-facing screens
- **No PII in logs:** Analytics events, error reports (Sentry), and server logs contain no personal data
- **Secrets:** Never hardcoded — `.env.local` for local dev, Azure App Settings / AWS Secrets Manager in production

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Web App

```bash
# Clone the repo
git clone https://github.com/anirudhasi/master-kid.git
cd master-kid

# Install web dependencies
cd apps/web
npm install

# Create local env file (never committed to git)
cp .env.example .env.local
# Add your OpenAI key to .env.local:
# VITE_OPENAI_API_KEY=sk-your-key-here

# Start dev server
npm run dev
# App runs at http://localhost:3000
```

### Mobile App (Expo)

```bash
cd apps/mobile
npm install
npx expo start
# Press 'w' for browser, 'i' for iOS simulator, 'a' for Android emulator
```

### Environment Variables

**`apps/web/.env.local`** (local dev only, git-ignored):
```
VITE_API_URL=http://localhost:8000
VITE_OPENAI_API_KEY=sk-your-openai-key
```

**Azure App Settings** (production — set in Azure portal, never in code):
```
OPENAI_API_KEY=sk-your-openai-key
```

---

## Deployment — Azure

The web app is deployed to **Azure Static Web Apps** with a built-in Azure Function for the secure OpenAI proxy.

### Architecture in Azure

```
GitHub push to main
    → GitHub Actions workflow triggers
    → npm ci + npm run build (apps/web)
    → Azure Static Web Apps deploy action
        → Uploads dist/ to Azure CDN (global)
        → Deploys apps/web/api/ as Azure Functions
        → Live at https://your-app.azurestaticapps.net
```

### One-time Setup (Azure Portal)

1. Go to [portal.azure.com](https://portal.azure.com) → search **Static Web Apps** → **Create**

2. Fill in:
   - **Resource group:** `master-kids-rg` (create new)
   - **Name:** `master-kids`
   - **Region:** East Asia or Central India
   - **Source:** GitHub → `anirudhasi/master-kid` → branch: `main`
   - **Build preset:** Custom
   - **App location:** `apps/web`
   - **Api location:** `apps/web/api`
   - **Output location:** `dist`

3. After creation, go to **Configuration** → **Application settings** → Add:
   - Name: `OPENAI_API_KEY`
   - Value: your OpenAI API key

4. Copy the **Deployment Token** from Overview → Manage deployment token

5. Add it to GitHub: repo Settings → Secrets and variables → Actions → New secret:
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: paste the deployment token

Every `git push` to `main` now auto-deploys. No manual steps needed.

---

## CI/CD Pipeline

The workflow at `.github/workflows/azure-static-web-apps.yml` runs on every push to `main`:

```
Trigger: git push to main
    ↓
actions/checkout@v4          — pull latest code
actions/setup-node@v4        — Node 20, cached npm
npm ci (apps/web)            — clean install from lockfile
npm run build (apps/web)     — Vite production build → dist/
Azure/static-web-apps-deploy — upload to Azure CDN + deploy API functions
```

For **pull requests**, Azure creates a temporary staging environment automatically. When the PR is closed, it tears down the staging environment. This means every PR gets its own preview URL.

### Daily Development Flow

```bash
# Make changes locally
git add .
git commit -m "feat: your feature description"
git push origin main
# → Auto-deploys to Azure in ~2 minutes
```

---

## Code Conventions

- **Language:** TypeScript everywhere, strict mode enabled
- **Formatting:** Prettier with default config
- **Linting:** ESLint with react + typescript rules
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **API responses:** Always `{ data, error, meta }` shape
- **Commits:** Conventional commits — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- **Tests:** Co-located with source files (`Component.test.tsx` next to `Component.tsx`)
- **No comments on obvious code** — only comment the *why*, never the *what*

---

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| `dev` | Local development | `http://localhost:3000` |
| `staging` | Auto-created per PR by Azure | `https://random-name.azurestaticapps.net` |
| `production` | Main branch auto-deploy | `https://master-kids.azurestaticapps.net` |

---

## Contributing

This is a private build. To start a coding session with Claude Code:

> "We are building Master-Kids. Read CLAUDE.md. We are currently in [Phase X]. Today's task is [specific feature]."

This loads full context before any code is written.

---

*Built for Indian children and parents — one log at a time.*
