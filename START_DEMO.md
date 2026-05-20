# Master-Kids — Demo Startup Guide

## Prerequisites
- Node.js 18+
- Python 3.11+
- A **free** Groq API key (get at https://console.groq.com — no credit card needed)

---

## Step 1 — Set API Keys

### Mobile app
Copy `apps/mobile/.env.example` → `apps/mobile/.env`:
```
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_groq_key_here
```

### Python backend
Copy `apps/backend-py/.env.example` → `apps/backend-py/.env`:
```
GROQ_API_KEY=gsk_your_groq_key_here
```

---

## Step 2 — Start the Python Backend (Terminal 1)

```bash
cd apps/backend-py
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verify: http://localhost:8000/health → `{"status":"ok"}`

---

## Step 3 — Start the Web App (Terminal 2)

```bash
cd apps/web
npm install
npm run dev
```

Open: **http://localhost:3000**

### Web Pages
| Route | Description |
|-------|-------------|
| `/` | Landing — investor hero page |
| `/child` | Child gamification dashboard |
| `/parent` | Parent AI summary + charts |
| `/tutor` | Tutor session logging |
| `/tutors` | Tutor marketplace |

---

## Step 4 — Start the Mobile App (Terminal 3)

```bash
cd apps/mobile
npx expo start --web
```

Or for native: scan QR with Expo Go app.

---

## Demo Flow (10 minutes)

1. **Open web `/`** — Show hero landing with stats
2. **Navigate to `/child`** — Tap 3 subject tiles (Math, English, Science) → watch XP animate
3. **Navigate to `/parent`** — Click "Refresh" → AI generates parent summary via Groq (free)
4. **Navigate to `/tutor`** — Save a tutor session → AI summary generated instantly
5. **Show mobile** — Same experience, native feel

---

## AI Stack
- **Primary (Free):** Groq API with `llama3-8b-8192` — no cost, ~200ms
- **Fallback:** OpenAI `gpt-4o-mini` — if Groq key not set
- **No key set:** App still works with intelligent fallback text

---

## Architecture
```
apps/
  mobile/      ← React Native + Expo (iOS/Android/Web)
  web/         ← React + Vite + Tailwind + Framer Motion
  backend-py/  ← Python FastAPI + Groq/OpenAI
packages/
  shared/      ← Shared TypeScript types
```
