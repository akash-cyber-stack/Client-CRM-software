# Multi-company (tenant) CRM

Each **company** is isolated by `companyId`. Users sign in with **GSTIN + email/password** or **OAuth** (after GST is verified on the login page).

## Flows

1. **New company** — Login → *New company* → Verify GST → Register company + Super Admin.
2. **Join company** — Login → *Join company* → Verify GST → Register as Manager / Employee.
3. **Sign in** — Verify GST → Email + password, or Google / Microsoft / GitHub.
4. **Add another company** (Super Admin / Manager) — Sidebar → **Companies** → Register with verified GST.

## GST verification

| Mode | Env | Behavior |
|------|-----|----------|
| `mock` | `GST_VERIFICATION_MODE=mock` | Dev: accepts valid 15-char GSTIN checksum |
| `format` | `format` | Checksum only, no live API |
| `api` | `api` + `GST_API_KEY` | Calls `GST_API_URL` (e.g. AppyFlow) |

## OAuth setup

Set client IDs in Vercel/env. Redirect URLs must match your API host:

- `https://YOUR-API/api/auth/oauth/google/callback`
- `https://YOUR-API/api/auth/oauth/microsoft/callback`
- `https://YOUR-API/api/auth/oauth/github/callback`

Users must enter **company GST** on the login page before clicking a social button.

## Webhooks (per company)

Append GST to webhook URLs:

```
POST /api/webhooks/google-leads?gstin=22AAAAA0000A1Z5
POST /api/webhooks/meta-leads?gstin=22AAAAA0000A1Z5
POST /api/webhooks/ivr-call-completed?gstin=22AAAAA0000A1Z5
```

Configure secrets per company under **Settings**.

## Upgrading existing database

```bash
cd backend
npx prisma db push
node prisma/migrate-legacy-tenant.js   # if you had data before multi-tenant
```

Legacy login GST (if migration script ran): `29AAAAA0000A1Z5`

## Demo GST numbers (valid checksum)

| Company | GSTIN | Use |
|---------|-------|-----|
| AR Group (existing Neon data) | `27AABCU9603R1ZP` | Sign in / Join — 26 leads, 8 users |
| Sunrise Edu Demo (empty) | `06AABCT5557R1ZP` | **New company** tab — register fresh tenant |

## How data stays separate (Neon)

Same database `neondb`, but every row is tagged with `company_id`:

```
companies                    leads / users / calls
┌─────────────────┐         ┌──────────────────────────┐
│ AR Group        │◄────────│ company_id = AR uuid     │  ← 26 leads (screenshot)
│ GST 27AABCU…    │         └──────────────────────────┘
├─────────────────┤         ┌──────────────────────────┐
│ Sunrise Edu     │◄────────│ company_id = Sunrise uuid │  ← 0 leads until they add
│ GST 06AABCT…    │         └──────────────────────────┘
└─────────────────┘
```

In Neon **Tables → leads**: scroll columns right → you will see **`company_id`** (not shown in default view).

App login: user enters GST → API only returns rows where `company_id` matches that company.
