# System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐         ┌──────────────────────────┐   │
│  │   PUBLIC PORTAL     │         │    ADMIN DASHBOARD       │   │
│  │  (Fluent UI)        │         │    (Authenticated)       │   │
│  ├─────────────────────┤         ├──────────────────────────┤   │
│  │ • Home Page         │         │ • Login Page             │   │
│  │ • Project Listing   │         │ • Project Management     │   │
│  │ • Project Details   │         │ • Create/Edit Projects   │   │
│  │ • Score Charts      │         │ • Publish/Unpublish      │   │
│  │ • Timeline View     │         │ • Delete Projects        │   │
│  └─────────────────────┘         └──────────────────────────┘   │
│           │                                    │                  │
└───────────┼────────────────────────────────────┼─────────────────┘
            │                                    │
            └──────────────┬─────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS FRONTEND                          │
│                     (http://localhost:3000)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ App Router   │  │  Components  │  │  API Client        │   │
│  │ • /          │  │ • Cards      │  │ • axios            │   │
│  │ • /[slug]    │  │ • Forms      │  │ • Authentication   │   │
│  │ • /admin     │  │ • Tables     │  │ • Error handling   │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │ JSON Data
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS BACKEND                          │
│                     (http://localhost:5000)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Routes     │  │  Middleware  │  │   Controllers      │   │
│  │ • /auth      │  │ • JWT Auth   │  │ • Business Logic   │   │
│  │ • /projects  │  │ • CORS       │  │ • Validation       │   │
│  │ • /health    │  │ • Error      │  │ • Data Transform   │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Mongoose ODM
                             │ CRUD Operations
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MONGODB DATABASE                         │
│                (mongodb://localhost:27017/audit-portal)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Collections                                              │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                            │   │
│  │  projects                                                  │   │
│  │  ├─ Basic Info (name, symbol, decimals, supply...)        │   │
│  │  ├─ Socials (telegram, twitter, website...)               │   │
│  │  ├─ Contract Info (address, owner, verified...)           │   │
│  │  ├─ Overview (honeypot, taxes, risk flags...)             │   │
│  │  ├─ Findings (minor, medium, major, critical...)          │   │
│  │  ├─ Timeline (request, preview, release...)               │   │
│  │  ├─ Metrics (score, confidence, views, votes)             │   │
│  │  └─ Publishing (published, live status)                   │   │
│  │                                                            │   │
│  │  users                                                     │   │
│  │  ├─ email (unique, indexed)                               │   │
│  │  ├─ password (bcrypt hashed)                              │   │
│  │  ├─ name                                                   │   │
│  │  └─ role (admin, owner)                                   │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Public Portal (Read)
```
User Browser
    │
    ├─> GET /                    → Fetch all published projects
    │
    ├─> GET /[slug]              → Fetch specific project by slug
    │                              (increments page_view counter)
    │
    └─> Display project data with Fluent UI components
```

### Admin Portal (Write)
```
Admin Browser
    │
    ├─> POST /api/auth/login     → Authenticate admin
    │       Returns: JWT token
    │
    ├─> Store token in localStorage
    │
    ├─> GET /api/projects/admin/all → Fetch all projects (with auth)
    │
    ├─> POST /api/projects       → Create new project
    │   Body: Complete project data (all fields)
    │
    ├─> PUT /api/projects/:id    → Update existing project
    │   Body: Updated project data
    │
    ├─> PATCH /api/projects/:id/publish → Toggle published status
    │   Body: { published: true/false }
    │
    └─> DELETE /api/projects/:id → Remove project
```

## Security Flow

```
1. Admin logs in
   └─> Email + Password sent to /api/auth/login
       └─> Backend validates credentials
           └─> bcrypt.compare(password, hashedPassword)
               └─> If valid: Generate JWT token
                   └─> Token contains: { userId, exp: 7 days }

2. Admin makes authenticated request
   └─> Token sent in Authorization header
       └─> Middleware extracts and verifies token
           └─> jwt.verify(token, JWT_SECRET)
               ├─> Valid: Attach user to request, continue
               └─> Invalid: Return 401 Unauthorized

3. Public requests
   └─> No authentication required
       └─> Only access to published projects
```

## Component Hierarchy

```
Frontend
│
├─ app/
│  ├─ layout.tsx (FluentProvider wrapper)
│  │
│  ├─ page.tsx (Home)
│  │  ├─ Header
│  │  ├─ Most Voted Section
│  │  ├─ Most Viewed Section
│  │  └─ Recently Added Section
│  │
│  ├─ [slug]/page.tsx (Project Detail)
│  │  ├─ Project Header
│  │  ├─ Score Card
│  │  ├─ Token Analysis
│  │  ├─ Risk Assessment
│  │  ├─ Findings Table
│  │  ├─ Timeline
│  │  └─ Contract Info
│  │
│  └─ admin/
│     ├─ page.tsx (Login)
│     ├─ dashboard/page.tsx (Project List)
│     │  └─ DataGrid with actions
│     └─ projects/[id]/page.tsx (Form)
│        ├─ Basic Info Section
│        ├─ Socials Section
│        ├─ Contract Info Section
│        ├─ Overview Section
│        ├─ Findings Section
│        ├─ Timeline Section
│        └─ Publishing Section
│
└─ lib/
   ├─ api.ts (HTTP client)
   └─ types.ts (TypeScript interfaces)
```

## Technology Stack

```
┌──────────────────────────────────────────────────┐
│ FRONTEND                                         │
├──────────────────────────────────────────────────┤
│ • Next.js 14 (App Router, React 18)              │
│ • TypeScript                                      │
│ • Fluent UI React Components (v9)                │
│ • Fluent UI React Icons                          │
│ • Recharts (Data visualization)                  │
│ • React Markdown (Rich text display)             │
│ • Axios (HTTP client)                            │
│ • SWR (Data fetching)                            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ BACKEND                                          │
├──────────────────────────────────────────────────┤
│ • Node.js                                        │
│ • Express.js                                     │
│ • MongoDB + Mongoose                             │
│ • JWT (jsonwebtoken)                             │
│ • bcryptjs (Password hashing)                    │
│ • CORS                                           │
│ • dotenv (Environment config)                    │
└──────────────────────────────────────────────────┘
```
