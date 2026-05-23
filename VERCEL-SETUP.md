# Vercel — required environment variables

Add **all** of these in Vercel → Settings → Environment Variables (Production + Preview):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon **Pooled** connection string (`?sslmode=require`) |
| `JWT_SECRET` | e.g. `crm-jwt-secret-change-this-2026` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://ar-crm-iota.vercel.app` (or your active production URL) |
| `GOOGLE_WEBHOOK_SECRET` | `google-secret-demo` |
| `META_WEBHOOK_VERIFY_TOKEN` | `meta-verify-token-demo` |
| `META_WEBHOOK_SECRET` | `meta-secret-demo` |
| `IVR_WEBHOOK_SECRET` | `ivr-secret-demo` |

**Do NOT** set `VITE_API_URL` on Vercel.

**Framework Preset:** **Other** (not Services)

## Production URLs

| URL | Status |
|-----|--------|
| **https://ar-crm-iota-pi.vercel.app** | Latest build (linked to `akash-cyber-stack/Client-CRM-software`) |
| **https://ar-crm-iota.vercel.app** | May show an **older** deployment if it is attached to a **different** Vercel project/account |

If localhost looks correct but `ar-crm-iota.vercel.app` does not:

1. Open **Vercel Dashboard** → find which project owns `ar-crm-iota.vercel.app`.
2. Either **Redeploy** that project from GitHub `main`, or **remove** the domain from the old project and add it to project **ar-crm-iota** (`akashpandeyweconnect` team).
3. Until then, use **https://ar-crm-iota-pi.vercel.app** — same code as localhost.
4. Hard refresh: `Ctrl + Shift + R`.

## After deploy — test

1. `https://ar-crm-iota-pi.vercel.app/api/health` → `{"ok":true,...}`
2. `https://ar-crm-iota-pi.vercel.app/api/auth/setup-status` → JSON with `hasSuperAdmin`
3. Login page → Register as **Super Admin** (first user)

## Neon

Use **Pooled** connection from Neon Console → Connect.
