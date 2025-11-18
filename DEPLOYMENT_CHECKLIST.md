# 🚀 Quick Deployment Checklist

## Before Pushing to GitHub

- [ ] Get MongoDB password from Atlas (see instructions below)
- [ ] Test locally first
- [ ] Commit all code to git

## MongoDB Setup

### Get Your Password:
1. Go to https://cloud.mongodb.com
2. Click **"Database Access"** in left sidebar
3. Find user **"auditadmin"** → Click **"Edit"**
4. Click **"Edit Password"**
5. Click **"Autogenerate Secure Password"**
6. **COPY the password** (save it somewhere safe!)
7. Click **"Update User"**

### Get Connection String:
1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your actual password

Example:
```
mongodb+srv://auditadmin:abc123XYZ@cluster0.xxxxx.mongodb.net/auditportal?retryWrites=true&w=majority
```

## GitHub Setup

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Audit Portal"

# Create repo on GitHub (https://github.com/new)
# Then link and push:
git remote add origin https://github.com/YOUR_USERNAME/audit-portal.git
git branch -M main
git push -u origin main
```

## Vercel Deployment Strategy

### Recommended: Split Deployment

**Frontend (Vercel)** ✅ Best for Next.js
**Backend (Railway)** ✅ Best for Express + MongoDB

### Frontend on Vercel:
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure:
   - Root Directory: `frontend`
   - Framework: Next.js
   - Build Command: `npm run build`
6. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app/api
   ```
7. Deploy!

### Backend on Railway:
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Click "Add variables" and add:
   ```
   MONGODB_URI = mongodb+srv://auditadmin:YOUR_PASSWORD@cluster0...
   JWT_SECRET = change-this-super-secret-key-in-production-123
   FRONTEND_URL = https://your-app.vercel.app
   PORT = 5000
   NODE_ENV = production
   ```
6. Settings → Set Root Directory: `backend`
7. Deploy!

### Update Frontend with Backend URL:
1. Copy your Railway backend URL
2. Go to Vercel → Your Project → Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` with Railway URL
4. Redeploy frontend

## Alternative: Monorepo on Vercel (Advanced)

Deploy both on Vercel using the included `vercel.json` configs.

## Post-Deployment

- [ ] Test frontend: https://your-app.vercel.app
- [ ] Test backend: https://your-backend.railway.app/health
- [ ] Test login with: admin@cfg.ninja / admin123
- [ ] Create a test project in admin panel
- [ ] Verify it appears on home page

## Troubleshooting

**Can't connect to MongoDB:**
- Verify password is correct (no special characters need URL encoding)
- Check MongoDB Atlas → Network Access → Allow from anywhere (0.0.0.0/0)

**API calls fail:**
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify backend CORS includes your Vercel URL
- Check browser console for errors

**Build fails:**
- Ensure Node.js 18+ in both package.json engines
- Check all dependencies are installed

## Need the password retrieval steps?

Run this command to see them again:
```bash
# See MongoDB password instructions
cat VERCEL_DEPLOYMENT.md
```
