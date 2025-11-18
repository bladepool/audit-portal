# ✅ Setup Checklist

Use this checklist to ensure everything is set up correctly.

## Prerequisites ☑️

- [ ] Node.js 18+ installed
  - Check: `node --version`
  - Download: https://nodejs.org/

- [ ] MongoDB installed OR MongoDB Atlas account
  - Local: `mongod --version`
  - Cloud: https://www.mongodb.com/cloud/atlas

- [ ] Code editor (VS Code recommended)

---

## Installation Steps ☑️

### 1. Install Dependencies
- [ ] Run setup script
  ```powershell
  .\setup.ps1
  ```
  OR manually:
  - [ ] `npm install` (root)
  - [ ] `cd frontend && npm install`
  - [ ] `cd backend && npm install`

### 2. Configure Backend
- [ ] Create `backend\.env` file
- [ ] Set `MONGODB_URI`
  - Local: `mongodb://localhost:27017/audit-portal`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/audit-portal`
- [ ] Set `JWT_SECRET` (random string, 32+ characters)
- [ ] Set `PORT=5000`
- [ ] Set `NODE_ENV=development`
- [ ] Set `FRONTEND_URL=http://localhost:3000`

### 3. Configure Frontend
- [ ] Create `frontend\.env.local` file
- [ ] Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

### 4. Start MongoDB
- [ ] If using local MongoDB, start it
  ```bash
  mongod
  ```
- [ ] If using Atlas, ensure connection string is correct

### 5. Seed Database
Choose one:

**Option A: Admin Only**
- [ ] Run `cd backend && npm run seed`
- Creates admin user only

**Option B: Admin + Sample Projects**
- [ ] Run `cd backend && npm run seed:full`
- Creates admin user + 2 sample projects

---

## First Run ☑️

### 1. Start Application
- [ ] Open terminal in `g:\auditportal`
- [ ] Run `npm run dev`
- [ ] Wait for both servers to start
  - Frontend: http://localhost:3000
  - Backend: http://localhost:5000

### 2. Verify Backend
- [ ] Open http://localhost:5000/api/health
- [ ] Should see: `{"status":"ok",...}`

### 3. Verify Frontend
- [ ] Open http://localhost:3000
- [ ] Should see home page with gradient background
- [ ] If seeded with sample data, should see project cards

### 4. Test Admin Login
- [ ] Go to http://localhost:3000/admin
- [ ] Login with:
  - Email: `admin@cfg.ninja`
  - Password: `admin123`
- [ ] Should redirect to dashboard
- [ ] Should see project list (empty or with samples)

---

## First Project Creation ☑️

### 1. Access Admin Dashboard
- [ ] Navigate to http://localhost:3000/admin/dashboard
- [ ] Click "New Project" button

### 2. Fill Basic Information
- [ ] Name (required)
- [ ] Symbol (required)
- [ ] Decimals (required, usually 9 or 18)
- [ ] Supply (required)
- [ ] Description (required, can use Markdown)
- [ ] Click "Regenerate" to auto-generate slug

### 3. Add Social Links (Optional)
- [ ] Telegram URL
- [ ] Twitter URL
- [ ] Website URL
- [ ] Others as needed

### 4. Contract Information
- [ ] Contract name
- [ ] Contract address
- [ ] Owner address
- [ ] Toggle "Contract Verified" if applicable
- [ ] Compiler version
- [ ] Creation date (MM/DD/YYYY format)

### 5. Risk Assessment
- [ ] Toggle switches for applicable risks
- [ ] Set buy tax (0-100)
- [ ] Set sell tax (0-100)

### 6. Audit Findings
- [ ] Enter found/pending/resolved counts for each severity
- [ ] Minor, Medium, Major, Critical, Informational

### 7. Additional Info
- [ ] Platform (e.g., "Binance Smart Chain")
- [ ] Audit Score (0-100)
- [ ] Audit Confidence (Low/Medium/High)
- [ ] Codebase URL

### 8. Timeline
- [ ] Audit request date
- [ ] Onboarding date
- [ ] Preview date
- [ ] Release date

### 9. Publish
- [ ] Toggle "Publish Project" to make it visible
- [ ] Click "Create Project"

### 10. Verify Project
- [ ] Should redirect to dashboard
- [ ] Find your project in the list
- [ ] Click view icon or navigate to http://localhost:3000/[your-slug]
- [ ] Verify all data displays correctly

---

## Functionality Testing ☑️

### Public Portal
- [ ] Home page loads
- [ ] Projects are displayed in sections
- [ ] Can click on a project
- [ ] Project detail page shows all information
- [ ] Score chart displays
- [ ] Timeline shows correctly
- [ ] Social links work

### Admin Dashboard
- [ ] Can login
- [ ] Can see all projects
- [ ] Can sort/filter projects
- [ ] Publish toggle works
- [ ] Can edit project
- [ ] Can delete project
- [ ] Can logout

### API Endpoints
- [ ] `GET /api/health` returns status
- [ ] `POST /api/auth/login` returns token
- [ ] `GET /api/projects` returns published projects
- [ ] `GET /api/projects/:slug` returns specific project
- [ ] Admin endpoints require authentication

---

## Common Issues & Fixes ☑️

### MongoDB Connection Failed
- [ ] Check if MongoDB is running
- [ ] Verify connection string in backend\.env
- [ ] Try MongoDB Atlas if local fails

### Port Already in Use
- [ ] Backend: Change PORT in backend\.env
- [ ] Frontend: Run with `npm run dev -- -p 3001`

### Can't Login
- [ ] Verify admin was created: `cd backend && npm run seed`
- [ ] Check browser console for errors
- [ ] Check backend terminal for errors
- [ ] Verify JWT_SECRET is set in backend\.env

### TypeScript Errors
- [ ] Run `npm run install:all` again
- [ ] Restart VS Code
- [ ] Errors won't affect functionality during development

### Projects Not Showing
- [ ] Make sure project is published (toggle in admin)
- [ ] Check backend console for errors
- [ ] Verify MongoDB connection
- [ ] Try creating a new project

### Blank Page
- [ ] Check browser console (F12)
- [ ] Check that backend is running
- [ ] Verify API URL in frontend\.env.local
- [ ] Hard refresh (Ctrl+F5)

---

## Production Readiness ☑️

Before deploying to production:

### Security
- [ ] Change admin password
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Configure CORS properly
- [ ] Add input validation
- [ ] Enable MongoDB authentication

### Environment
- [ ] Set NODE_ENV=production
- [ ] Use production MongoDB URI
- [ ] Update FRONTEND_URL to production domain
- [ ] Update NEXT_PUBLIC_API_URL to production API

### Build
- [ ] Test `npm run build` in frontend
- [ ] Test production start scripts
- [ ] Verify all environment variables
- [ ] Test on production-like environment

### Backup
- [ ] Set up MongoDB backups
- [ ] Document deployment process
- [ ] Create admin user management system
- [ ] Set up monitoring/logging

---

## Customization ☑️

### Design
- [ ] Update colors in `frontend\src\app\globals.css`
- [ ] Replace placeholder logo images
- [ ] Customize header/footer
- [ ] Add your branding

### Features
- [ ] Add file upload for logos
- [ ] Implement voting system
- [ ] Add comment section
- [ ] Set up email notifications
- [ ] Add PDF report generation

### Data
- [ ] Add more sample projects
- [ ] Customize project fields
- [ ] Add new sections
- [ ] Modify risk assessment options

---

## Documentation ☑️

- [ ] Read README.md
- [ ] Review INSTALLATION.md
- [ ] Check QUICKSTART.md
- [ ] Study ARCHITECTURE.md
- [ ] Review START_HERE.md

---

## Success Indicators ☑️

You'll know everything is working when:

- [ ] ✅ Both servers start without errors
- [ ] ✅ You can login to admin panel
- [ ] ✅ You can create a new project
- [ ] ✅ Published project appears on home page
- [ ] ✅ Project detail page displays correctly
- [ ] ✅ All CRUD operations work
- [ ] ✅ Publish/unpublish toggle works
- [ ] ✅ No console errors

---

## Getting Help ☑️

If you're stuck:

1. [ ] Check this checklist again
2. [ ] Review error messages in:
   - Browser console (F12)
   - Backend terminal
   - Frontend terminal
3. [ ] Verify all environment variables
4. [ ] Try the sample data: `npm run seed:full`
5. [ ] Restart everything and try again

---

**Ready to start? Begin with the Installation Steps section above!** 🚀
