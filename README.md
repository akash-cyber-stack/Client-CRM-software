# Sales Lead CRM

Production-ready MVP CRM for lead management, sales call tracking, IVR integration, and Google Ads + Meta Ads lead ingestion.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |

## Features

- **Authentication** – JWT login, role-based access (Super Admin, Manager, Sales Employee)
- **Employee Management** – CRUD, IVR Agent ID / extension, activate/deactivate
- **Lead Management** – Manual + webhook leads, filters, search, round-robin assignment
- **Google Ads Webhook** – `POST /api/webhooks/google-leads`
- **Meta Ads Webhook** – `POST /api/webhooks/meta-leads` (+ GET verification)
- **IVR Integration** – `POST /api/webhooks/ivr-call-completed` – links calls by phone & agent ID, stores recording URLs
- **Call History** – Filters, audio player, lead linking
- **Follow-ups** – Today / pending / missed lists
- **Dashboard** – Admin & sales employee views
- **Reports** – Employee, calls, campaigns, conversions + CSV export
- **Notifications** – Lead assigned, call recording, duplicates

## Project Structure

```
CRM/
├── backend/          # Express API + Prisma
├── frontend/         # React SPA
├── samples/          # Sample webhook JSON payloads
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE sales_lead_crm;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET in .env

npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API runs at **http://localhost:5000**

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:5173**

## First-time setup

1. Open http://localhost:5173
2. Click **Register**
3. If no Super Admin exists, choose **Super Admin (one-time only)** — only one allowed
4. Otherwise register as **Manager** or **Sales Employee**

**Sign In / Register** are on the same login page.

## Clear demo data

```bash
cd backend
npm run db:clear    # remove all users, leads, calls
npm run db:seed     # restore default settings only
```

## API Routes

### Auth
- `GET /api/auth/setup-status`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Calls (IVR)
- `POST /api/calls/initiate` — start outbound call (demo mode if `ivr_api_url` empty)

### Employees (Admin)
- `GET/POST /api/employees`
- `PUT/DELETE /api/employees/:id`

### Leads
- `GET/POST /api/leads`
- `GET/PUT/DELETE /api/leads/:id`
- `POST /api/leads/:id/assign`
- `POST /api/leads/:id/notes`
- `POST /api/leads/:id/follow-up`

### Calls
- `GET /api/calls`
- `GET /api/calls/:id`
- `GET /api/calls/employee/:employeeId`
- `GET /api/calls/lead/:leadId`

### Reports
- `GET /api/reports/dashboard`
- `GET /api/reports/employees`
- `GET /api/reports/calls`
- `GET /api/reports/campaigns`
- `GET /api/reports/conversions`

### Webhooks (no JWT – use secrets)
- `POST /api/webhooks/google-leads`
- `POST/GET /api/webhooks/meta-leads`
- `POST /api/webhooks/ivr-call-completed`

## Webhook Testing

Sample payloads are in `samples/`. Test with curl:

```bash
# Google Ads lead
curl -X POST http://localhost:5000/api/webhooks/google-leads \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: google-secret-demo" \
  -d @samples/google-leads-webhook.json

# IVR call completed
curl -X POST http://localhost:5000/api/webhooks/ivr-call-completed \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: ivr-secret-demo" \
  -d @samples/ivr-call-completed-webhook.json
```

## Business Logic

- **Duplicate leads** – Same phone won't create a new lead; timeline logs duplicate source/campaign
- **Round-robin** – Skips inactive sales employees; pointer stored in `lead_assignment_state`
- **IVR matching** – Employee by `ivr_agent_id`, lead by normalized phone
- **Unlinked calls** – Saved when no lead match; `isLinked: false`
- **Role scoping** – Sales employees only see their assigned leads and calls

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

## Deploy to Vercel

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step instructions (Neon Postgres, env vars, `prisma db push`, webhooks).

Quick summary: import the repo on Vercel, set `DATABASE_URL` + `JWT_SECRET` + `FRONTEND_URL`, deploy, then run `npx prisma db push` against your cloud database.

## License

MIT
