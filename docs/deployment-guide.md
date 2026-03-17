# StudentLife AI - Deployment Guide

Complete guide for deploying to Vercel (Frontend) + Render (Backend) + Supabase (Database)

## Prerequisites

- GitHub account
- Vercel account (free tier)
- Render account (free tier)
- Supabase account (free tier)
- OpenAI API key

---

## Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Click "New Project"
   - Name: `studentlife-ai`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
   - Click "Create new project"

### 1.2 Get Database Connection Details

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Copy the following:
   - **Connection string** (URI format)
   - **Host**
   - **Database name** (usually `postgres`)
   - **Port** (usually `5432`)
   - **User** (usually `postgres`)
   - **Password** (the one you set)

### 1.3 Initialize Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire content from `docs/database-schema.sql`
4. Paste and click "Run"
5. Verify tables are created in **Table Editor**

---

## Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/studentlife-ai.git
git push -u origin main
```

### 2.2 Create Render Web Service

1. Go to [https://render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `studentlife-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Instance Type**: Free

### 2.3 Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
NODE_ENV=production
PORT=10000

# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
DB_HOST=[PROJECT-REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR-SUPABASE-PASSWORD]

# JWT (generate random string)
JWT_SECRET=[GENERATE-RANDOM-32-CHAR-STRING]
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-[YOUR-OPENAI-KEY]
OPENAI_MODEL=gpt-3.5-turbo

# CORS (will update after Vercel deployment)
CORS_ORIGIN=https://[YOUR-APP].vercel.app
FRONTEND_URL=https://[YOUR-APP].vercel.app

# Redis (Optional - leave empty for now)
REDIS_URL=
```

### 2.4 Generate JWT Secret

Run this command locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `JWT_SECRET`

### 2.5 Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Copy your Render URL: `https://studentlife-backend.onrender.com`
4. Test health check: `https://studentlife-backend.onrender.com/api/health`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3.2 Add Environment Variables

In Vercel project settings → **Environment Variables**, add:

```
NEXT_PUBLIC_API_URL=https://studentlife-backend.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://studentlife-backend.onrender.com
```

### 3.3 Deploy

1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. Copy your Vercel URL: `https://studentlife-ai.vercel.app`

### 3.4 Update Backend CORS

1. Go back to Render dashboard
2. Update environment variables:
   ```
   CORS_ORIGIN=https://studentlife-ai.vercel.app
   FRONTEND_URL=https://studentlife-ai.vercel.app
   ```
3. Render will automatically redeploy

---

## Step 4: Optional - Setup Redis Cache (Upstash)

### 4.1 Create Upstash Redis

1. Go to [https://upstash.com](https://upstash.com)
2. Create account and new database
3. Choose free tier
4. Copy the Redis URL

### 4.2 Add to Render

1. In Render environment variables, update:
   ```
   REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
   ```
2. Save and redeploy

---

## Step 5: Verify Deployment

### 5.1 Test Backend

```bash
# Health check
curl https://studentlife-backend.onrender.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 5.2 Test Frontend

1. Open `https://studentlife-ai.vercel.app`
2. Check browser console for errors
3. Verify WebSocket connection

### 5.3 Test Database

1. Try creating a user account
2. Check Supabase Table Editor to see if data is saved

---

## Step 6: Post-Deployment Configuration

### 6.1 Custom Domain (Optional)

**Vercel:**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

**Render:**
1. Go to Settings → Custom Domain
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update CORS settings

### 6.2 Enable HTTPS

Both Vercel and Render provide automatic HTTPS certificates.

### 6.3 Monitor Logs

**Render:**
- Dashboard → Logs tab

**Vercel:**
- Project → Deployments → View Function Logs

**Supabase:**
- Dashboard → Logs

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Test database connection from Supabase dashboard

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS_ORIGIN in backend matches Vercel URL
- Check browser console for CORS errors

### Database connection fails
- Verify Supabase project is active
- Check if IP is whitelisted (Supabase allows all by default)
- Test connection string in Supabase SQL Editor

### WebSocket not connecting
- Verify NEXT_PUBLIC_SOCKET_URL is correct
- Check if Render service is running
- Render free tier may sleep after inactivity (first request takes 30s)

---

## Cost Breakdown (Free Tier Limits)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Vercel | ✅ Free | 100GB bandwidth/month |
| Render | ✅ Free | 750 hours/month, sleeps after 15min inactivity |
| Supabase | ✅ Free | 500MB database, 2GB bandwidth |
| Upstash Redis | ✅ Free | 10,000 commands/day |
| OpenAI | 💰 Paid | $5 free credits for new accounts |

**Total Monthly Cost:** $0 (excluding OpenAI usage)

---

## Local Development

```bash
# Install dependencies
npm run install:all

# Setup database
cd backend
npm run db:setup

# Start backend
npm run dev

# In another terminal, start frontend
cd frontend
npm run dev
```

Visit: `http://localhost:3000`

---

## Environment Variables Summary

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
OPENAI_API_KEY=sk-...
CORS_ORIGIN=http://localhost:3000
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Next Steps

1. ✅ Deploy to production
2. 🔐 Setup authentication (JWT already configured)
3. 📧 Add email notifications (SendGrid/Resend)
4. 📊 Add analytics (Vercel Analytics)
5. 🔍 Add error tracking (Sentry)
6. 🚀 Optimize performance
7. 📱 Build mobile app (React Native)

---

## Support

- **Documentation**: `/docs` folder
- **API Endpoints**: `docs/api-endpoints.md`
- **Architecture**: `docs/architecture.md`
- **Database Schema**: `docs/database-schema.sql`

---

## License

MIT
