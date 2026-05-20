# Master-Kids — Complete Build

Premium habit tracking platform for children with AI-powered summaries.

## Project Structure

```
master-kids/
├── apps/
│   ├── mobile/          ← React Native (Expo) for iOS/Android/Web
│   ├── web/             ← React 19 + Vite for web dashboard
│   └── backend/         ← Python FastAPI for API
├── packages/
│   └── shared/          ← Shared TypeScript types
└── README.md
```

## Features (Phase 1)

✅ **Child Logging** - Voice/tap-based quick log in 10 seconds
✅ **Parent Dashboard** - AI-powered daily summaries via OpenAI
✅ **Tutor Network** - Tutor profile discovery and session logging
✅ **Gamification** - XP points, streaks, badges, levels
✅ **Web + Mobile** - Expo web support + premium React web UI

## Quick Start

### 1. Install Dependencies

**Mobile (Expo):**
```bash
cd apps/mobile
npm install
```

**Web:**
```bash
cd apps/web
npm install
```

**Backend:**
```bash
cd apps/backend
pip install -r requirements.txt
```

### 2. Environment Setup

Create `.env` files:

**apps/mobile/.env:**
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key
```

**apps/web/.env (optional):**
```
VITE_API_URL=http://localhost:8000
```

**apps/backend/.env:**
```
OPENAI_API_KEY=sk-your-openai-key
```

### 3. Run Locally

**Backend (Terminal 1):**
```bash
cd apps/backend
python main.py
# API available at http://localhost:8000
```

**Web (Terminal 2):**
```bash
cd apps/web
npm run dev
# App available at http://localhost:3000
```

**Mobile (Terminal 3):**
```bash
cd apps/mobile
npm start
# Press 'w' for web, 'i' for iOS, 'a' for Android
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Web | React 19 + Vite + Tailwind + Framer Motion |
| Backend | Python FastAPI + Pydantic |
| AI | OpenAI Chat Completions |
| State (Mobile) | Zustand + React Query |
| Charts | Recharts |
| Icons | Lucide React |

## API Endpoints

All endpoints prefixed with `/api`:

- `POST /logs` - Create a new log
- `GET /logs` - List all logs
- `DELETE /logs/{id}` - Delete log
- `GET /summary` - Generate AI parent summary
- `GET /tutors` - List tutors
- `GET /tutors/{id}` - Get specific tutor
- `GET /health` - Health check

Full API docs at: http://localhost:8000/docs

## UI Features

### Landing Page
- Hero section with gradient animations
- Feature cards with icons
- Stats display
- CTA buttons

### Child Dashboard (Web)
- Quick log interface (subject + activity + mood)
- XP progress bar
- Streak flame display
- Recent activity log
- Badge collection

### Parent Dashboard (Web)
- AI-generated summary section
- Weekly XP chart with line graph
- Real-time metrics (XP, streak, consistency, level)
- Recent activity timeline
- Export and share options

### Tutor Marketplace
- Tutor discovery cards
- Rating and experience display
- Subject filtering
- Search functionality
- "Apply as Tutor" CTA

## Deployment

### Web (Vercel)
```bash
cd apps/web
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Railway/Heroku)
```bash
cd apps/backend
git push heroku main
```

### Mobile (Expo EAS)
```bash
cd apps/mobile
eas build --platform all
```

## OpenAI Integration

The app uses OpenAI's GPT-3.5-turbo for:
- **Parent summaries** - Daily activity summaries in natural language
- **Tutor reports** - Session notes and homework summaries

Cost control:
- Haiku for high-volume operations (structured data)
- Sonnet for quality outputs (summaries)
- Fallback local text generation if API unavailable

## License

MIT License - See LICENSE file

## Support

For questions or issues, please visit the documentation or contact support@master-kids.com

---

**Built with ❤️ for children's learning**
