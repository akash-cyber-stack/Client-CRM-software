# Vercel — required environment variables

Add **all** of these in Vercel → Settings → Environment Variables (Production + Preview):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon **Pooled** connection string (`?sslmode=require`) |
| `JWT_SECRET` | e.g. `crm-jwt-secret-change-this-2026` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://ar-crm-iota.vercel.app` |
| `GOOGLE_WEBHOOK_SECRET` | `google-secret-demo` |
| `META_WEBHOOK_VERIFY_TOKEN` | `meta-verify-token-demo` |
| `META_WEBHOOK_SECRET` | `meta-secret-demo` |
| `IVR_WEBHOOK_SECRET` | `ivr-secret-demo` |

**Do NOT** set `VITE_API_URL` on Vercel.

**Framework Preset:** **Other** (not Services)

## After deploy — test

1. https://ar-crm-iota.vercel.app/api/health → `{"ok":true,...}`
2. https://ar-crm-iota.vercel.app/api/auth/setup-status → JSON with `hasSuperAdmin`
3. Login page → Register as **Super Admin** (first user)

## Neon

Use **Pooled** connection from Neon Console → Connect.
