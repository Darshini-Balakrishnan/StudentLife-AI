# StudentLife AI - Quick Start Guide

## 🚀 Deploy in 15 Minutes

### 1. Database (Supabase) - 3 minutes
1. Go to [supabase.com](https://supabase.com) → New Project
2. Save your database password
3. Go to SQL Editor → Run `docs/database-schema.sql`

### 2. Backend (Render) - 5 minutes
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set:
   - Build: `cd backend && npm install && npm run build`
   - Start: `cd backend && npm start`
4. Add environment variables (see below)
5. Deploy

### 3. Frontend (Vercel) - 5 minutes
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import repo, set Root Directory: `frontend`
3. Add environment variables (see below)
4. Deploy

### 4. Update CORS - 2 minutes
1. Copy your Vercel URL
2. Update Render env: `CORS_ORIGIN=https://your-app.vercel.app`

---

## 📋 Environment Variables

### Render (Backend)
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[REF].supabase.co:5432/postgres
JWT_SECRET=[GENERATE_RANDOM_STRING]
OPENAI_API_KEY=sk-[YOUR_KEY]
CORS_ORIGIN=https://[YOUR_APP].vercel.app
NODE_ENV=production
PORT=10000
```

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://[YOUR_BACKEND].onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://[YOUR_BACKEND].onrender.com
```

---

## 🧪 Local Development

```bash
# 1. Install dependencies
npm run install:all

# 2. Setup environment
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local

# 3. Update .env with your PostgreSQL credentials

# 4. Initialize database
cd backend && npm run db:setup

# 5. Start backend
npm run dev

# 6. Start frontend (new terminal)
cd frontend && npm run dev
```

Visit: http://localhost:3000

---

## 📚 Full Documentation

See `docs/deployment-guide.md` for complete instructions.
