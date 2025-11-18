# 🚀 Audit Portal - Installation & Usage Guide

## 📋 What's Included

This is a **complete, production-ready prototype** of the CFG Ninja Audit Portal with:

✅ **Frontend (Next.js + Fluent UI)**
- Modern, responsive design with Fluent Design principles
- Home page with Most Voted, Most Viewed, Recently Added sections
- Dynamic project pages (e.g., /sakuraai)
- Admin dashboard with full CRUD operations
- Real-time data synchronization

✅ **Backend (Node.js + Express + MongoDB)**
- RESTful API with JWT authentication
- Complete project model with ALL fields from your specification
- Publish/unpublish functionality
- Auto-incrementing page views
- Secure authentication with bcrypt

✅ **All Features from Your Specification**
- ✓ Basic info (name, symbol, decimals, supply, description, logo, launchpad, slug)
- ✓ Social links (telegram, twitter, website, github, etc.)
- ✓ Contract info (name, language, owner, deployer, address, verified, compiler, license)
- ✓ Live status
- ✓ Overview/Risk assessment (honeypot, hidden_owner, trading_cooldown, taxes, etc.)
- ✓ Severity findings (minor, medium, major, critical, informational)
- ✓ Codebase URL and platform
- ✓ Timeline (audit_request, onboarding, preview, release)
- ✓ Audit metrics (confidence, score, launchpad link)
- ✓ Page views and votes tracking
- ✓ Score history visualization
- ✓ Publishing control

---

## 🛠️ Installation

### Prerequisites

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Check: `node --version`

2. **MongoDB**
   - **Option A**: Local MongoDB
     - Download: https://www.mongodb.com/try/download/community
     - Start: `mongod`
   - **Option B**: MongoDB Atlas (Cloud)
     - Sign up: https://www.mongodb.com/cloud/atlas
     - Get connection string

### Step 1: Install Dependencies

**On Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Manual installation:**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Environment

1. **Backend** - Copy and edit `backend\.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/audit-portal
JWT_SECRET=change-this-to-a-random-secret-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

2. **Frontend** - Copy and edit `frontend\.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 3: Create Admin User

```bash
cd backend
node seed.js
```

**Default Credentials:**
- Email: `admin@cfg.ninja`
- Password: `admin123`

⚠️ **Change this password after first login!**

### Step 4: Start Application

```bash
# From root directory
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Admin Panel**: http://localhost:3000/admin

---

## 📖 Usage Guide

### Creating Your First Project

1. **Login to Admin**
   - Go to http://localhost:3000/admin
   - Use credentials from Step 3

2. **Create New Project**
   - Click "New Project" button
   - Fill in the form with your project details
   
3. **Form Sections**:

   **Basic Information** (Required)
   - Name: Project name (e.g., "Dog MAGA")
   - Symbol: Token symbol (e.g., "DOGMAGA")
   - Decimals: Usually 9 or 18
   - Supply: Total supply (e.g., "1,000,000,000")
   - Slug: URL-friendly name (auto-generated)
   - Description: Full project description (supports Markdown)
   - Logo URL: Link to project logo
   - Launchpad: Platform name (e.g., "Pinksale")

   **Social Links**
   - Telegram, Twitter, Website, GitHub, etc.
   - All optional but recommended

   **Contract Information**
   - Contract name, language, compiler
   - Owner and deployer addresses
   - Contract address
   - Verified status (toggle)
   - Creation date (MM/DD/YYYY format)

   **Overview / Risk Assessment**
   - Toggle switches for all security checks
   - Buy/Sell tax percentages
   - Enable trade text

   **Audit Findings**
   - Found/Pending/Resolved counts for each severity:
     - Minor
     - Medium  
     - Major
     - Critical
     - Informational

   **Additional Information**
   - Platform (e.g., "Binance Smart Chain")
   - Audit Score (0-100)
   - Audit Confidence (Low/Medium/High)
   - Codebase URL

   **Timeline**
   - Audit request date
   - Onboarding process date
   - Audit preview date
   - Audit release date

   **Publishing**
   - Toggle to publish (make visible on portal)

4. **Save Project**
   - Click "Create Project" or "Save Changes"
   - Project is now in the system

### Publishing a Project

1. In admin dashboard, find your project
2. Click the eye icon to publish/unpublish
3. Published projects appear on public portal
4. Unpublished projects are drafts (admin only)

### Editing a Project

1. In admin dashboard, click edit icon
2. Update any fields
3. Click "Save Changes"

### Deleting a Project

1. In admin dashboard, click delete icon
2. Confirm deletion

### Viewing Public Portal

1. Go to http://localhost:3000
2. Browse projects by:
   - Most Voted
   - Most Viewed
   - Recently Added
3. Click any project to see full details
4. Project pages are at: http://localhost:3000/[slug]
   - Example: http://localhost:3000/dogmaga

---

## 🎨 Design Features

### Fluent UI Components
- Modern Microsoft Fluent Design
- Consistent styling
- Accessible components
- Responsive layouts

### Color Scheme
- Primary: Purple gradient (#667eea to #764ba2)
- Success: Green indicators
- Warning: Yellow/Orange
- Error: Red
- Info: Blue

### Visualizations
- Score charts (Recharts)
- Timeline displays
- Badge system for status
- Card-based layouts

---

## 📁 Project Structure

```
audit-portal/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── [slug]/         # Dynamic project pages
│   │   │   │   └── page.tsx
│   │   │   ├── admin/          # Admin section
│   │   │   │   ├── page.tsx    # Login
│   │   │   │   ├── dashboard/  # Dashboard
│   │   │   │   └── projects/   # Project form
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── globals.css     # Global styles
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   └── types.ts        # TypeScript types
│   └── package.json
├── backend/                     # Express API
│   ├── src/
│   │   ├── models/
│   │   │   ├── Project.js      # Project schema (ALL fields)
│   │   │   └── User.js         # User/Admin schema
│   │   ├── routes/
│   │   │   ├── auth.js         # Auth routes
│   │   │   └── projects.js     # Project routes
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT middleware
│   │   └── server.js           # Express server
│   ├── seed.js                 # Create admin user
│   └── package.json
├── setup.ps1                    # Windows setup script
├── README.md                    # Documentation
├── QUICKSTART.md               # Quick reference
└── package.json                # Root package.json
```

---

## 🔌 API Reference

### Authentication

**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "admin@cfg.ninja",
  "password": "admin123"
}
```

**GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`

### Projects (Public)

**GET** `/api/projects?sort=recent|votes|views`
- Returns all published projects

**GET** `/api/projects/:slug`
- Returns single project by slug
- Increments page view counter

### Projects (Admin - Auth Required)

**GET** `/api/projects/admin/all`
- Returns all projects (including unpublished)

**GET** `/api/projects/admin/:id`
- Returns single project by ID

**POST** `/api/projects`
- Create new project
- Body: Complete project object

**PUT** `/api/projects/:id`
- Update existing project
- Body: Complete project object

**DELETE** `/api/projects/:id`
- Delete project

**PATCH** `/api/projects/:id/publish`
```json
{
  "published": true
}
```

**POST** `/api/projects/generate-slug`
```json
{
  "name": "Project Name"
}
```

---

## 🚀 Production Deployment

### 1. Build Frontend
```bash
cd frontend
npm run build
```

### 2. Environment Variables
Update for production:
- Change `JWT_SECRET` to strong random value
- Use production MongoDB URI
- Set `NODE_ENV=production`
- Update CORS settings

### 3. Deploy Backend
- Deploy to: Heroku, Railway, DigitalOcean, AWS, etc.
- Ensure MongoDB is accessible

### 4. Deploy Frontend
- Deploy to: Vercel, Netlify, or your hosting
- Update `NEXT_PUBLIC_API_URL` to backend URL

---

## 🔧 Customization

### Change Colors
Edit `frontend/src/app/globals.css`:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  /* ... */
}
```

### Add File Upload
Install multer (already included), configure storage:
```javascript
// In backend
const multer = require('multer');
const storage = multer.diskStorage({ /* config */ });
```

### Modify Schema
Edit `backend/src/models/Project.js` to add fields

### Add Features
- Email notifications
- User voting system
- Comments section
- PDF report generation

---

## ❓ Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Try MongoDB Atlas if local fails

### "Port 3000 already in use"
```bash
# Use different port
cd frontend
npm run dev -- -p 3001
```

### "Module not found" errors
```bash
# Reinstall dependencies
npm run install:all
```

### Admin login fails
```bash
# Recreate admin user
cd backend
node seed.js
```

### TypeScript errors
- Ignore during development (packages not installed yet)
- Run `npm run install:all`
- Restart VS Code

---

## 📞 Support

1. Check this guide and README.md
2. Review console logs (browser & terminal)
3. Verify environment variables
4. Ensure MongoDB is running
5. Check all dependencies installed

---

## ✅ Checklist

Before going live:

- [ ] Changed default admin password
- [ ] Updated JWT_SECRET
- [ ] Configured production MongoDB
- [ ] Set proper CORS origins
- [ ] Added rate limiting
- [ ] Enabled HTTPS
- [ ] Backed up database
- [ ] Tested all features
- [ ] Optimized images
- [ ] Set up monitoring

---

**You now have a fully functional audit portal prototype!** 🎉

The portal mirrors the design and functionality of audit.cfg.ninja with all the fields you specified. You can create projects through the admin panel, and they'll display on dedicated pages just like /sakuraai.
