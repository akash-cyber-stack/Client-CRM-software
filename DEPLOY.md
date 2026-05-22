# Deploy Sales Lead CRM on Vercel

This project deploys **frontend + API** on one Vercel app using **Services** (`experimentalServices` in `vercel.json`):

- **Frontend** (Vite) → `/`
- **Backend** (Express) → `/_/backend` (API calls: `/_/backend/api/...`)

In Vercel import settings, choose Framework Preset: **Services** (auto-detected).

## 1. Cloud PostgreSQL (required)

Vercel cannot use your local Postgres. Create a free database:

- [Neon](https://neon.tech) (recommended), or
- [Supabase](https://supabase.com), or
- [Vercel Postgres](https://vercel.com/storage/postgres)

Copy the connection string (must start with `postgresql://`).

## 2. Push code to GitHub

```bash
cd CRM
git init
git add .
git commit -m "Prepare for Vercel deploy"
git remote add origin https://github.com/YOUR_USER/sales-lead-crm.git
git push -u origin main
```

## 3. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. **Root Directory:** set to `CRM` if the repo root is `Desktop`, or leave blank if repo root is the `CRM` folder
4. Framework Preset: **Services** (must match `experimentalServices` in `vercel.json`)

## 4. Environment variables

Add these in **Project → Settings → Environment Variables** (Production + Preview):

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Long random string |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (your live URL) |
| `GOOGLE_WEBHOOK_SECRET` | Your secret |
| `META_WEBHOOK_VERIFY_TOKEN` | Your token |
| `META_WEBHOOK_SECRET` | Your secret |
| `IVR_WEBHOOK_SECRET` | Your secret |

Optional for first admin (only if you run seed):

| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PASSWORD` | Strong password |

`VITE_API_URL` is **not required** on Vercel — the frontend uses `/api` on the same domain.

## 5. Database on Neon

Tables are created with:

```bash
cd backend
# DATABASE_URL = Neon connection string from console
npx prisma db push
```

Optional: `npm run db:seed` (default settings only).

**See [VERCEL-SETUP.md](./VERCEL-SETUP.md)** for the exact Vercel env var checklist.

## 6. CLI deploy (alternative)

```bash
cd CRM
npx vercel login
npx vercel link
npx vercel env pull .env.local
# Add DATABASE_URL etc. in Vercel dashboard, then:
npx vercel --prod
```

## Webhook URLs (production)

- Google: `https://YOUR_APP.vercel.app/_/backend/api/webhooks/google-leads`
- Meta: `https://YOUR_APP.vercel.app/_/backend/api/webhooks/meta-leads`
- IVR: `https://YOUR_APP.vercel.app/_/backend/api/webhooks/ivr-call-completed`

## Troubleshooting

- **CORS errors:** Set `FRONTEND_URL` to your exact Vercel URL (no trailing slash).
- **500 on login:** Check `DATABASE_URL` and run `prisma db push` on Neon.
- **API 404:** Ensure `vercel.json` is at the project root Vercel uses.
