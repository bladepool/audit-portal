# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB installed locally OR MongoDB Atlas account

## Installation

### Option 1: Using Setup Script (Windows)
```powershell
.\setup.ps1
```

### Option 2: Manual Installation
```bash
# Install all dependencies
npm run install:all

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

## Configuration

### 1. Backend Configuration (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/audit-portal
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/audit-portal

JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend Configuration (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## First Run

### 1. Start MongoDB (if using local)
```bash
mongod
```

### 2. Seed Admin User
```bash
cd backend
node seed.js
```
This creates:
- Email: `admin@cfg.ninja`
- Password: `admin123`

### 3. Start Development Servers
```bash
# From root directory
npm run dev
```

This starts:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

## Using the Application

### Admin Panel
1. Go to http://localhost:3000/admin
2. Login with the credentials above
3. Click "New Project" to create your first audit project
4. Fill in all the fields (matches your backend specification)
5. Click "Publish" switch to make it visible on the portal
6. Save the project

### Public Portal
1. Visit http://localhost:3000
2. See all published projects
3. Click on a project to view details
4. Project pages are at http://localhost:3000/[slug]

## Project Structure

```
audit-portal/
├── frontend/              # Next.js + Fluent UI
│   ├── src/
│   │   ├── app/          # Pages (App Router)
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── [slug]/page.tsx       # Dynamic project page
│   │   │   └── admin/                # Admin section
│   │   ├── components/   # Reusable components
│   │   └── lib/          # API & utilities
│   └── package.json
├── backend/              # Express + MongoDB
│   ├── src/
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth middleware
│   │   └── server.js     # Entry point
│   └── package.json
└── package.json          # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Projects (Public)
- `GET /api/projects` - Get all published projects
- `GET /api/projects/:slug` - Get project by slug

### Projects (Admin - Auth Required)
- `GET /api/projects/admin/all` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `PATCH /api/projects/:id/publish` - Publish/Unpublish

## Features

✅ All fields from your backend specification
✅ Full CRUD operations for projects
✅ Publish/Unpublish functionality
✅ JWT authentication
✅ Fluent UI design system
✅ Responsive layout
✅ Real-time data updates
✅ Dynamic routing (/projectname)
✅ Score visualization with charts
✅ All audit findings tracking
✅ Timeline management
✅ Social links integration
✅ Contract information display

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running: `mongod`
- Or use MongoDB Atlas and update the connection string

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Use `npm run dev -- -p 3001` to use different port

### TypeScript Errors
- Install dependencies first: `npm run install:all`
- Restart VS Code if issues persist

### Can't Login
- Make sure you ran the seed script: `node backend/seed.js`
- Check backend logs for errors

## Next Steps

1. **Customize Design**: Update colors in `frontend/src/app/globals.css`
2. **Add File Upload**: Implement image upload for logos
3. **Email Integration**: Add email notifications
4. **Enhanced Security**: Add rate limiting, CORS configuration
5. **Production Deploy**: Build and deploy to your hosting

## Production Deployment

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## Support

For issues or questions:
- Check the README.md
- Review console logs
- Ensure all dependencies are installed
- Verify environment variables are set correctly
