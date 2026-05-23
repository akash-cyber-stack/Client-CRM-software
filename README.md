# Sales Lead CRM

A production-ready CRM platform for lead management, sales employee call tracking, IVR call recording integration, and Google Ads + Meta Ads lead capture.

Sales Lead CRM helps sales teams manage leads, assign leads to employees, track call activity, store IVR call recordings, manage follow-ups, and monitor campaign performance from one centralized dashboard.

---

## Live Demo

**Application URL:**  
## Local URLs (important)

| What | URL |
|------|-----|
| **Frontend (CRM UI)** | http://localhost:5173 |
| **Backend API only** | http://localhost:5000 — `/api/health`, not the dashboard |

Run both: `npm run dev` from project root.

## Live (Vercel)

| URL | Notes |
|-----|--------|
| https://ar-crm-iota.vercel.app | Project **ar-crm** (argroupads) — use after redeploy from GitHub `main` |
| https://ar-crm-iota-pi.vercel.app | Alternate deploy; same code if env vars are set |

Login: https://ar-crm-iota.vercel.app/login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcrypt |
| Deployment | Vercel |
| Cloud Database | Neon PostgreSQL |

---

## Key Features

- Role-based authentication
  - Super Admin
  - Manager
  - Sales Employee

- Employee management
  - Add, edit, delete employees
  - Activate/deactivate employees
  - Assign employee roles
  - Store IVR Agent ID
  - Store IVR extension/mobile number

- Lead management
  - Manual lead creation
  - Google Ads lead capture
  - Meta/Facebook/Instagram lead capture
  - Lead search and filters
  - Lead status tracking
  - Lead notes and remarks
  - Follow-up date management
  - Duplicate lead detection
  - Round-robin lead assignment

- IVR call tracking
  - Employee-wise call logs
  - Incoming/outgoing/missed call records
  - Call duration tracking
  - Call status tracking
  - IVR Agent ID mapping
  - Customer phone number matching
  - Call recording URL storage
  - Recording audio player

- Follow-up system
  - Today follow-ups
  - Pending follow-ups
  - Missed follow-ups
  - Employee-wise follow-up tracking

- Dashboard and reports
  - Admin dashboard
  - Sales employee dashboard
  - Source-wise lead reports
  - Employee-wise call reports
  - Campaign-wise reports
  - Conversion reports
  - CSV export support

- Webhook integrations
  - Google Ads lead webhook
  - Meta Ads lead webhook
  - IVR call completed webhook

---

## Project Structure

```text
CRM/
├── backend/              # Express API, Prisma schema, routes, controllers
├── frontend/             # React frontend application
├── samples/              # Sample webhook payloads
├── scripts/              # Utility scripts
├── DEPLOY.md             # Deployment guide
├── README.md             # Project documentation
├── vercel.json           # Vercel deployment configuration
└── package.json
