# StudentLife AI - Deployment Checklist

## Pre-Deployment

- [ ] Code pushed to GitHub repository
- [ ] All environment variables documented
- [ ] Database schema tested locally
- [ ] API endpoints tested
- [ ] WebSocket connections tested
- [ ] Frontend builds successfully
- [ ] Backend builds successfully

## Supabase Setup

- [ ] Supabase account created
- [ ] New project created
- [ ] Database password saved securely
- [ ] Database schema executed successfully
- [ ] Tables verified in Table Editor
- [ ] Connection string copied
- [ ] Database credentials documented

## Render Backend Deployment

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Web service created
- [ ] Build command configured: `cd backend && npm install && npm run build`
- [ ] Start command configured: `cd backend && npm start`
- [ ] Environment variables added:
  - [ ] DATABASE_URL
  - [ ] DB_HOST
  - [ ] DB_PORT
  - [ ] DB_NAME
  - [ ] DB_USER
  - [ ] DB_PASSWORD
  - [ ] JWT_SECRET (generated)
  - [ ] OPENAI_API_KEY
  - [ ] NODE_ENV=production
  - [ ] PORT=10000
- [ ] First deployment successful
- [ ] Health check endpoint working: `/api/health`
- [ ] Render URL copied

## Vercel Frontend Deployment

- [ ] Vercel account created
- [ ] GitHub repository imported
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Next.js
- [ ] Environment variables added:
  - [ ] NEXT_PUBLIC_API_URL (Render backend URL)
  - [ ] NEXT_PUBLIC_SOCKET_URL (Render backend URL)
- [ ] First deployment successful
- [ ] Vercel URL copied
- [ ] Frontend loads without errors

## CORS Configuration

- [ ] Vercel URL copied
- [ ] Render environment variables updated:
  - [ ] CORS_ORIGIN (Vercel URL)
  - [ ] FRONTEND_URL (Vercel URL)
- [ ] Backend redeployed
- [ ] CORS errors resolved
- [ ] Frontend can connect to backend

## OpenAI API Setup

- [ ] OpenAI account created
- [ ] API key generated
- [ ] API key added to Render environment
- [ ] AI endpoints tested
- [ ] Usage limits understood

## Optional: Redis Cache (Upstash)

- [ ] Upstash account created
- [ ] Redis database created (free tier)
- [ ] Redis URL copied
- [ ] REDIS_URL added to Render
- [ ] Backend redeployed
- [ ] Cache working (check logs)

## Testing

- [ ] Frontend loads successfully
- [ ] User can register/login
- [ ] Events can be created and viewed
- [ ] Resources can be uploaded
- [ ] Expenses can be tracked
- [ ] AI assistant responds
- [ ] WebSocket real-time updates work
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] No CORS errors

## Monitoring

- [ ] Render logs checked
- [ ] Vercel function logs checked
- [ ] Supabase logs checked
- [ ] Error tracking setup (optional: Sentry)
- [ ] Analytics setup (optional: Vercel Analytics)

## Documentation

- [ ] README.md updated with deployment URLs
- [ ] Environment variables documented
- [ ] API documentation accessible
- [ ] Deployment guide reviewed

## Security

- [ ] All secrets stored securely
- [ ] JWT_SECRET is random and secure
- [ ] Database password is strong
- [ ] API keys not exposed in frontend
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation working

## Performance

- [ ] Frontend loads in < 3 seconds
- [ ] API responses < 500ms
- [ ] WebSocket connects quickly
- [ ] Images optimized
- [ ] Database queries optimized
- [ ] Caching enabled (if using Redis)

## Post-Deployment

- [ ] Custom domain configured (optional)
- [ ] SSL certificates verified
- [ ] Backup strategy planned
- [ ] Monitoring alerts setup
- [ ] Team access configured
- [ ] Documentation shared with team

## Troubleshooting Completed

- [ ] Render free tier sleep behavior understood
- [ ] Database connection pool configured
- [ ] WebSocket fallback tested
- [ ] Error pages customized
- [ ] 404 pages working

## Launch

- [ ] All checklist items completed
- [ ] Final testing done
- [ ] Team notified
- [ ] Users can access application
- [ ] Support channels ready

---

## Quick Reference

### URLs
- Frontend: `https://[your-app].vercel.app`
- Backend: `https://[your-backend].onrender.com`
- Database: Supabase Dashboard
- Redis: Upstash Dashboard (if used)

### Important Commands

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test backend health
curl https://[your-backend].onrender.com/api/health

# View Render logs
# Dashboard → Logs tab

# View Vercel logs
# Project → Deployments → Function Logs
```

### Support Resources
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Production URLs:**
- Frontend: _______________
- Backend: _______________
