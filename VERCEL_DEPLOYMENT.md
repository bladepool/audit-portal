# Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prepare GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Audit Portal"

# Create GitHub repo and push
# Go to https://github.com/new
# Create a new repository (e.g., "audit-portal")
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/audit-portal.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to https://vercel.com/signup
2. Sign up/login with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

### 3. Configure Environment Variables in Vercel

Go to your project settings in Vercel Dashboard → Environment Variables:

#### Frontend Environment Variables:
```
NEXT_PUBLIC_API_URL = https://your-backend-url.vercel.app/api
```

#### Backend Environment Variables (if deploying backend separately):
```
MONGODB_URI = mongodb+srv://auditadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/auditportal?retryWrites=true&w=majority
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL = https://your-frontend-url.vercel.app
PORT = 5000
```

### 4. Deploy Backend Separately (Recommended Approach)

Since Vercel is optimized for frontend/serverless, consider these options for backend:

#### Option A: Deploy Backend to Vercel Serverless
1. Create a new Vercel project for backend
2. Root Directory: `./backend`
3. Add all backend environment variables
4. Use the backend URL in frontend's `NEXT_PUBLIC_API_URL`

#### Option B: Deploy Backend to Railway/Render (Better for Express)
**Railway** (Recommended for Express):
1. Go to https://railway.app
2. Connect GitHub repository
3. Select backend folder
4. Add environment variables
5. Deploy automatically on push

**Render**:
1. Go to https://render.com
2. New Web Service
3. Connect GitHub repository
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add environment variables

### 5. Update Connection URLs

After deployment:
1. Get your backend URL (e.g., `https://audit-portal-backend.railway.app`)
2. Update Vercel environment variable `NEXT_PUBLIC_API_URL` with backend URL
3. Update backend `FRONTEND_URL` with your Vercel frontend URL
4. Redeploy if needed

## 📝 Project Structure for Vercel

```
auditportal/
├── frontend/          # Deploy this to Vercel (Next.js)
├── backend/           # Deploy to Railway/Render (Express API)
└── vercel.json        # Vercel configuration (if monorepo)
```

## 🔒 Security Checklist

- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0 for cloud deploy)
- [ ] Strong JWT_SECRET set in production
- [ ] Environment variables set in Vercel dashboard (not in code)
- [ ] CORS configured for your production frontend URL
- [ ] `.env` and `.env.local` in `.gitignore`

## 🔄 Auto-Deployment

Once connected to GitHub:
- Every push to `main` branch triggers automatic deployment
- Preview deployments for pull requests
- Rollback capability in Vercel dashboard

## 🌐 Custom Domain (Optional)

1. In Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., audit.yourdomain.com)
3. Follow DNS configuration instructions

## 🐛 Troubleshooting

**Build fails on Vercel:**
- Check Node.js version in `package.json` engines
- Ensure all dependencies are in `dependencies` not `devDependencies`

**API calls fail:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend CORS configuration includes frontend URL
- Verify MongoDB connection string is correct

**Database connection issues:**
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Verify connection string has correct password
- Check database name in connection string

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
