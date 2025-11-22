# Production Deployment Checklist

## ✅ Backend (API) Deployment

### 1. Pre-Deployment Verification

**Files to Deploy:**
- ✅ `src/routes/adminPdfRoutes.js` - Admin PDF generation with GitHub upload
- ✅ `src/routes/pdfRoutes.js` - Public PDF endpoints (if updated)
- ✅ `src/server.js` - Already has adminPdfRoutes registered
- ✅ `smart-pdf-bridge.js` - PDF generation bridge
- ✅ Environment variables (.env)

**Test Locally:**
```bash
cd g:\auditportal\backend
node src/server.js
```

**Endpoints to Test:**
- `GET /api/health` - Health check
- `POST /api/admin/generate-pdf` - Admin PDF generation
- `GET /api/projects/:slug/generate-pdf` - Public PDF generation (if applicable)

### 2. Environment Variables

**Required in Production:**
```env
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-url.com
```

**PDF Generation Paths:**
```env
# If paths differ in production
CUSTOM_CONTRACT_PATH=/path/to/custom/contract
GENERATED_PDFS_PATH=/path/to/generated-pdfs
GITHUB_PDFS_REPO_PATH=/path/to/github-pdfs-repo
```

### 3. Dependencies Check

```bash
# Ensure all dependencies are installed
cd g:\auditportal\backend
npm install

# Check for security vulnerabilities
npm audit

# Update if needed
npm audit fix
```

### 4. GitHub Repository Access

**Verify Git Configuration:**
```bash
cd g:\auditportal\backend\github-pdfs-repo
git config user.name
git config user.email
git remote -v
```

**Test Git Push:**
```bash
# Create test file
echo "test" > test-deploy.txt
git add test-deploy.txt
git commit -m "Test deployment access"
git push origin main
# Remove test
git rm test-deploy.txt
git commit -m "Remove test file"
git push origin main
```

### 5. Deployment Steps

**Option A: Vercel (Serverless)**
```bash
cd g:\auditportal\backend
vercel --prod
```

**Option B: Traditional Server (VPS/Cloud)**
```bash
# SSH to server
ssh user@your-server.com

# Clone/pull latest
git pull origin main

# Install dependencies
npm install --production

# Restart service
pm2 restart audit-portal-backend
# OR
systemctl restart audit-portal
```

**Option C: Docker**
```bash
# Build image
docker build -t audit-portal-backend .

# Run container
docker run -d -p 5000:5000 --env-file .env audit-portal-backend
```

### 6. Post-Deployment Testing

```bash
# Health check
curl https://api.your-domain.com/api/health

# Test admin PDF generation
curl -X POST https://api.your-domain.com/api/admin/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"projectId": "673d...", "uploadToGitHub": false}'
```

---

## ✅ Frontend Deployment

### 1. Pre-Deployment Verification

**Files to Deploy:**
- ✅ `frontend/src/app/admin/projects/[id]/page.tsx` - Updated with GitHub checkbox
- Environment variables

### 2. Environment Variables

**Required in Production:**
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NODE_ENV=production
```

### 3. Build Test

```bash
cd g:\auditportal\frontend
npm run build

# Test production build locally
npm start
```

### 4. Deployment Steps

**Vercel (Recommended for Next.js):**
```bash
cd g:\auditportal\frontend
vercel --prod
```

**Manual Deployment:**
```bash
npm run build
# Copy .next folder and dependencies to server
```

### 5. Post-Deployment Testing

- Navigate to admin panel
- Edit a project
- Verify "Upload to GitHub" checkbox appears
- Test PDF generation with checkbox checked/unchecked

---

## ✅ Database

### MongoDB Atlas Configuration

**Indexes:**
```javascript
// Ensure these indexes exist
db.projects.createIndex({ slug: 1 }, { unique: true })
db.projects.createIndex({ published: 1 })
db.projects.createIndex({ "contract.address": 1 })
db.projects.createIndex({ "metadata.data_source": 1 })
```

**Backup Before Deployment:**
```bash
# Export current database
mongodump --uri="mongodb+srv://..." --db=auditportal --out=backup-20251120
```

---

## ✅ GitHub Repository

### Verify Access

```bash
# Test authentication
cd g:\auditportal\backend\github-pdfs-repo
git fetch origin

# Verify repository
git remote -v
# Should show: https://github.com/CFG-NINJA/audits.git
```

### Set Up Deploy Keys (if needed)

1. Generate SSH key (if not exists)
2. Add to GitHub repository settings
3. Test SSH connection

---

## 🧪 Integration Testing

### Test Workflow End-to-End

1. **Create Test Project:**
   - Add new project in admin panel
   - Fill required fields

2. **Generate PDF:**
   - Check "Upload to GitHub"
   - Click "Generate PDF Report"
   - Verify success message with GitHub URL

3. **Verify PDF:**
   - Check generated-pdfs folder
   - Check github-pdfs-repo folder
   - Visit GitHub URL in browser
   - Verify PDF opens correctly

4. **Verify Database:**
   ```javascript
   // Check MongoDB
   db.projects.findOne({ slug: "test-project" })
   // Should have:
   // - pdf.generated: true
   // - pdf.url: GitHub URL
   // - pdf.github_hosted: true
   ```

---

## 📊 Monitoring

### Set Up Monitoring

**Backend:**
- API response times
- Error rates
- PDF generation success rate
- GitHub push failures

**Frontend:**
- Page load times
- Admin panel interactions
- PDF generation requests

**Database:**
- Query performance
- Connection pool usage
- Storage usage

---

## 🔒 Security Checklist

- [ ] Environment variables secured (not in git)
- [ ] API endpoints protected (authentication)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] GitHub credentials secured
- [ ] MongoDB connection string secured
- [ ] Admin routes protected

---

## 📝 Rollback Plan

### If Deployment Fails

**Backend:**
```bash
# Revert to previous version
git revert HEAD
git push origin main

# OR rollback Vercel deployment
vercel rollback
```

**Database:**
```bash
# Restore from backup
mongorestore --uri="mongodb+srv://..." --db=auditportal backup-20251120/auditportal
```

**Frontend:**
```bash
# Rollback Vercel deployment
vercel rollback
```

---

## ✅ Final Checks

Before marking deployment complete:

- [ ] Backend API responding (health check)
- [ ] Admin panel accessible
- [ ] PDF generation working
- [ ] GitHub upload working
- [ ] Database updates working
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] All tests passing

---

## 📞 Post-Deployment

1. Monitor logs for 24 hours
2. Test PDF generation for several projects
3. Verify GitHub repository updates
4. Check database integrity
5. Get user feedback

---

## 🎯 Success Criteria

Deployment is successful when:

✅ Admin can generate PDFs with GitHub upload
✅ PDFs appear in GitHub repository
✅ Database updates with GitHub URLs
✅ No errors in production logs
✅ Performance is acceptable
✅ All endpoints responding correctly
