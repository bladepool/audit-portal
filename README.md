# Audit Portal - CFG Ninja

A high-fidelity prototype of the CFG Ninja Audit Portal with Fluent UI design principles.

🌐 **Live Site**: https://audit-portal-gamma.vercel.app

## Features

- 🎨 Fluent UI design system
- 🔐 Admin authentication system
- 📊 Live project data from backend
- 🚀 Dynamic project pages
- 📝 Full CRUD operations for projects
- ✅ Publish/Unpublish functionality

## Project Structure

```
audit-portal/
├── frontend/          # Next.js frontend with Fluent UI
│   ├── src/
│   │   ├── app/       # Next.js app router
│   │   ├── components/# Reusable components
│   │   └── lib/       # Utilities and API calls
├── backend/           # Express.js backend API
│   ├── src/
│   │   ├── models/    # MongoDB models
│   │   ├── routes/    # API routes
│   │   ├── middleware/# Auth middleware
│   │   └── controllers/# Business logic
└── package.json       # Root package.json
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Configure environment variables:

Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/audit-portal
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Default Admin Credentials

- Email: admin@cfg.ninja
- Password: admin123 (Change in production!)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new admin

### Projects
- `GET /api/projects` - Get all published projects
- `GET /api/projects/:slug` - Get project by slug
- `POST /api/projects` - Create new project (Auth required)
- `PUT /api/projects/:id` - Update project (Auth required)
- `DELETE /api/projects/:id` - Delete project (Auth required)
- `PATCH /api/projects/:id/publish` - Publish/Unpublish (Auth required)

## Usage

### Admin Portal
1. Navigate to http://localhost:3000/admin
2. Login with credentials
3. Create/Edit projects with all audit information
4. Publish/Unpublish projects

### Public Portal
1. Main page: http://localhost:3000
2. Project pages: http://localhost:3000/[slug]
   - Example: http://localhost:3000/sakuraai

## Technologies

**Frontend:**
- Next.js 14 (App Router)
- Fluent UI React Components
- TypeScript
- Recharts (for score visualization)
- SWR (for data fetching)

**Backend:**
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Multer for file uploads

## Development Notes

- All form fields from the specification are included
- Real-time data synchronization
- Responsive design following Fluent principles
- Type-safe with TypeScript
- RESTful API design

## License

MIT
