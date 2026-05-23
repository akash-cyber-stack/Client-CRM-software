# Vercel — required environment variables

## Login error: `Environment variable not found: DATABASE_URL`

Project **ar-crm-iota** (`ar-crm-iota-pi.vercel.app`) has **no env vars** yet. Fix:

1. [Neon Console](https://console.neon.tech) → your project → **Connect** → copy **Pooled** connection string.
2. Vercel → [ar-crm-iota Settings → Environment Variables](https://vercel.com/akashpandeyweconnect-6582s-projects/ar-crm-iota/settings/environment-variables)
3. Add every variable in the table below (Production **and** Preview).
4. **Deployments** → latest → **⋯** → **Redeploy** (required after adding env).

**Tip:** If `ar-crm-iota.vercel.app` worked before, open that **old** Vercel project → Settings → Environment Variables → copy `DATABASE_URL` and paste into **ar-crm-iota**.

**CLI (optional):** copy `scripts/vercel-env.example` → `scripts/vercel-env.local`, fill values, then:

```powershell
powershell -File scripts/push-vercel-env.ps1
npx vercel deploy --prod
```

---

Add **all** of these in Vercel → Settings → Environment Variables (Production + Preview):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon **Pooled** connection string (`?sslmode=require`) |
| `JWT_SECRET` | e.g. `crm-jwt-secret-change-this-2026` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://ar-crm-iota-pi.vercel.app` |
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
