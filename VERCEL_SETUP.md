# Vercel Deployment Setup Guide

## 🚀 Quick Setup for Monorepo

Your Audit Portal is a **monorepo** with separate `frontend` and `backend` directories. Vercel needs to be configured to build only the frontend.

---

## ✅ Option 1: Vercel Dashboard Configuration (Recommended)

### Step 1: Project Settings

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **General**

Set these values:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

### Step 2: Environment Variables

Go to **Settings** → **Environment Variables**

Add these for all environments (Production, Preview, Development):

```env
# Required
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/auditportal

# Optional (fallbacks - settings are in database)
TATUM_API_KEY=t-69266c94cfecb979898695e4-37b9d1c3668248c6b1c3b1be
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_BOT_TOKEN=5266687259:AAGY-ACehGGzfOd1Wc3Gy1OXSgrjVt-s7RE
TELEGRAM_BOT_USERNAME=CFGNINJA_Bot
TELEGRAM_ADMIN_USER_ID=bladepool
```

### Step 3: Redeploy

Click **Deployments** → **...** (on latest deployment) → **Redeploy**

---

## ✅ Option 2: Using vercel.json (Automated)

The `vercel.json` file in the root handles the monorepo configuration automatically:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm run build",
  "installCommand": "cd frontend && npm install",
  "outputDirectory": "frontend/.next"
}
```

This tells Vercel:
- Change to `frontend` directory
- Run `npm install` there
- Run `npm run build` there
- Look for output in `frontend/.next`

**Note**: If you set Root Directory to `frontend` in dashboard, you don't need the `cd frontend &&` part.

---

## 🔧 Troubleshooting Build Errors

### Error: "Command 'npm run build' exited with 1"

**Cause**: Vercel is trying to build from root instead of frontend

**Solution**:
1. Go to **Settings** → **General**
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to `npm run build`
4. Set **Install Command** to `npm install`
5. Redeploy

### Error: "Cannot find module 'next'"

**Cause**: Dependencies not installed in correct directory

**Solution**:
1. Ensure **Root Directory** is set to `frontend`
2. Or use full command: `cd frontend && npm install && npm run build`

### Error: "Module not found: Can't resolve '@fluentui/react-components'"

**Cause**: Dependencies not installed

**Solution**:
```bash
# Locally verify build works
cd frontend
npm install
npm run build
```

If it works locally, the issue is Vercel configuration.

### Error: "API calls failing in production"

**Cause**: Backend API URL not configured

**Solution**:
1. Deploy backend to Railway first
2. Get Railway URL (e.g., `https://auditportal.up.railway.app`)
3. Set in Vercel: `NEXT_PUBLIC_API_URL=https://auditportal.up.railway.app`

---

## 📋 Complete Deployment Checklist

### Prerequisites
- [ ] MongoDB Atlas database created
- [ ] Backend deployed to Railway (or another host)
- [ ] Backend URL obtained
- [ ] Database settings initialized (ran init scripts)

### Vercel Configuration
- [ ] Root Directory set to `frontend`
- [ ] Build Command set to `npm run build`
- [ ] Install Command set to `npm install`
- [ ] Output Directory set to `.next`
- [ ] Environment variables added:
  - [ ] `NEXT_PUBLIC_API_URL` (backend URL)
  - [ ] `MONGODB_URI` (if needed for build)

### Deployment
- [ ] Commit and push to GitHub
- [ ] Vercel auto-deploys from `main` branch
- [ ] Build succeeds ✅
- [ ] Site loads at your-project.vercel.app
- [ ] API calls work (check browser console)
- [ ] Admin login works
- [ ] Settings page loads

### Post-Deployment
- [ ] Test logo upload (IPFS)
- [ ] Test audit request (Telegram)
- [ ] Check all pages load
- [ ] Verify no console errors

---

## 🎯 Recommended Architecture

For best results, deploy frontend and backend separately:

### Frontend (Vercel)
- **What**: Next.js frontend only
- **Directory**: `frontend/`
- **URL**: `https://audit-portal.vercel.app`
- **Hosts**: Static pages, client-side code

### Backend (Railway)
- **What**: Express API server
- **Directory**: `backend/`
- **URL**: `https://auditportal.up.railway.app`
- **Hosts**: API endpoints, database connections

### Connection
Frontend connects to backend via `NEXT_PUBLIC_API_URL`:

```typescript
// frontend/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

---

## 🚂 Backend Deployment (Railway)

Deploy backend separately to Railway:

```bash
# In backend directory
railway init
railway up
```

Or connect via GitHub:
1. Create new Railway project
2. Connect GitHub repository
3. Set Root Directory to `backend`
4. Add MongoDB plugin
5. Deploy

Get your Railway URL:
```
https://auditportal.up.railway.app
```

Use this as `NEXT_PUBLIC_API_URL` in Vercel.

---

## 📝 Environment Variables Reference

### Frontend (Vercel)

```env
# Backend API URL (Required)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# MongoDB (Optional - if backend is separate)
MONGODB_URI=mongodb+srv://...

# Not needed in frontend if backend is separate
# TATUM_API_KEY, PINATA_JWT, TELEGRAM_BOT_TOKEN
```

### Backend (Railway)

```env
# Database (Required)
MONGODB_URI=mongodb+srv://...

# JWT (Required)
JWT_SECRET=your-secret-key

# Optional - Settings are in database
TATUM_API_KEY=t-69266c94...
PINATA_JWT=eyJhbGci...
TELEGRAM_BOT_TOKEN=5266687259:...
TELEGRAM_BOT_USERNAME=CFGNINJA_Bot
TELEGRAM_ADMIN_USER_ID=bladepool

# CORS (Important!)
FRONTEND_URL=https://audit-portal.vercel.app
```

---

## ✅ Verification

After deployment, verify everything works:

### 1. Frontend Build
```bash
cd frontend
npm install
npm run build
# Should complete without errors
```

### 2. Backend API
```bash
curl https://your-backend.railway.app/api/health
# Should return: {"status":"ok"}
```

### 3. Frontend → Backend Connection
Open browser console on your Vercel deployment:
```javascript
fetch('https://your-backend.railway.app/api/projects?limit=1')
  .then(r => r.json())
  .then(console.log)
// Should return projects array
```

---

## 🎉 Success Checklist

Your deployment is successful when:

- ✅ Vercel build completes without errors
- ✅ Site loads at `your-project.vercel.app`
- ✅ All pages render correctly
- ✅ API calls return data (not CORS errors)
- ✅ Admin login works
- ✅ Settings page shows configured values
- ✅ Logo upload works (IPFS)
- ✅ Telegram bot responds
- ✅ No console errors

---

## 🆘 Still Having Issues?

### Check Build Logs

Vercel Dashboard → Deployments → Click failed deployment → View Logs

Look for:
- Where the build is running (root or frontend?)
- What command is being executed
- What's the actual error message

### Common Fixes

1. **Set Root Directory to `frontend`** (most common fix)
2. Check `vercel.json` is in repository root
3. Ensure `frontend/package.json` has correct dependencies
4. Verify Node.js version matches (20.x or 22.x)
5. Check environment variables are set

### Get Help

If still stuck:
1. Share full build log
2. Share `vercel.json` contents
3. Share Root Directory setting
4. Share Environment Variables (without sensitive values)

Your monorepo should now deploy successfully! 🚀
