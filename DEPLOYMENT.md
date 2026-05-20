# Master-Kids Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  iOS App     │  │ Android App  │  │  Web App     │      │
│  │  (Expo)      │  │  (Expo)      │  │  (React)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                      │
│                    http://localhost:8000                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  /api/logs  /api/summary  /api/tutors             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Services                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  OpenAI API  │  │  Supabase    │  │  Redis Cache │      │
│  │  (Summaries) │  │  (Database)  │  │  (Session)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Development Deployment

### Local Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/your-org/master-kids.git
   cd master-kids
   ```

2. **Run build script**
   - macOS/Linux: `bash build.sh`
   - Windows: `build.bat`

3. **Start services in separate terminals**
   ```bash
   # Terminal 1 - Backend
   cd apps/backend
   python main.py

   # Terminal 2 - Web
   cd apps/web
   npm run dev

   # Terminal 3 - Mobile
   cd apps/mobile
   npm start
   ```

## Production Deployment

### Backend Deployment (Python FastAPI)

#### Option 1: Railway.app (Recommended for Beginners)

1. Create account at railway.app
2. Connect GitHub repo
3. Create new project from GitHub
4. Select `apps/backend` as root directory
5. Add environment variables:
   - `OPENAI_API_KEY`
   - `DATABASE_URL` (if using Postgres)

#### Option 2: Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create master-kids-api

# Set environment variables
heroku config:set OPENAI_API_KEY=sk-xxx

# Deploy
git push heroku main
```

#### Option 3: AWS Lambda + API Gateway

1. Install AWS SAM CLI
2. Use FastAPI Mangum adapter for Lambda
3. Deploy: `sam deploy --guided`

### Web App Deployment (React)

#### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/web
vercel
```

Configuration in `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

#### Option 2: Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables

#### Option 3: AWS S3 + CloudFront

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Mobile App Deployment (Expo)

#### iOS Distribution

```bash
# Build for App Store
cd apps/mobile
eas build --platform ios --auto-submit

# Or submit manually
eas submit --platform ios
```

#### Android Distribution

```bash
# Build for Google Play
eas build --platform android --auto-submit

# Or submit manually
eas submit --platform android
```

### Database Setup (Supabase)

1. Create account at supabase.com
2. Create new project
3. Run migrations:
   ```bash
   # Connect to your Supabase instance
   psql postgresql://user:password@host/db < supabase/migrations/001_init.sql
   ```
4. Enable Row-Level Security
5. Set up auth policies

### Environment Variables

**Backend (.env)**
```
OPENAI_API_KEY=sk-xxx
DATABASE_URL=postgresql://user:pass@host/db
ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

**Web (.env.production)**
```
VITE_API_URL=https://api.yourdomain.com
VITE_GA_ID=your-ga-id
```

**Mobile (app.json + eas.json)**
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-splash-screen"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## Monitoring & Logging

### Sentry Setup (Error Tracking)

1. Create account at sentry.io
2. Create project
3. Add to mobile/web:
   ```
   @sentry/react, @sentry/react-native
   ```
4. Initialize in app startup

### CloudWatch Logs (Backend)

```python
import logging
import boto3

cloudwatch = boto3.client('logs')
logger = logging.getLogger(__name__)
```

### Analytics (PostHog)

Install and initialize for web/mobile:
```javascript
import posthog from 'posthog-js'
posthog.init('your-api-key', { api_host: 'https://app.posthog.com' })
```

## CI/CD Pipeline

### GitHub Actions Workflow

`.github/workflows/deploy.yml`:
```yaml
name: Deploy Master-Kids

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        env:
          RAILWAY_API_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: npm run deploy:backend

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: vercel --prod
```

## Performance Optimization

### Backend
- Enable gzip compression
- Use connection pooling for database
- Implement caching with Redis
- Rate limiting with slowapi

### Web
- Code splitting by route
- Image optimization
- CSS/JS minification (automatic with Vite)
- Service Worker for offline support

### Mobile
- Use Hermes engine for faster startup
- Enable ProGuard for Android
- Minimize bundle size

## Rollback Procedures

```bash
# Vercel
vercel rollback

# Railway
railway environment variable set DEPLOYMENT_ID <previous-id>

# GitHub Actions
git revert <commit-hash>
git push origin main
```

## Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS/SSL enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on backend
- [ ] SQL injection prevention
- [ ] XSS protection headers
- [ ] Regular dependency updates
- [ ] Database backups configured
- [ ] Monitoring and alerting active

---

For production deployments, always:
1. Test in staging first
2. Have a rollback plan
3. Monitor error rates post-deploy
4. Keep documentation updated
