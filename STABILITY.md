# CRM stability — many companies at once

Neon + Vercel par **har company alag `companyId`** se isolated hai. Crash kam karne ke liye ye layers add kiye gaye:

## Backend (automatic)

| Layer | Kya karta hai |
|-------|----------------|
| **Prisma singleton** | Har serverless instance par ek hi DB client — connection flood nahi |
| **DB retry** | Neon cold start / brief disconnect par 3 retry |
| **Rate limit** | 300 req/min per IP (auth: 40/min) — ek client sabko block nahi karega |
| **Request timeout** | 28s — Vercel kill se pehle clean 503 |
| **Error handler** | Prisma errors → JSON response, process crash nahi |
| **Import caps** | Max 500 leads / 200 employees per file |
| **Pagination cap** | Max 100 rows per API page |
| **IVR lookup** | Poora company table load nahi — phone index query |

## Frontend

| Layer | Kya karta hai |
|-------|----------------|
| **ErrorBoundary** | React render crash → refresh UI, white screen nahi |
| **API retry** | GET 503/429 par ek auto-retry |

## Aapko production par (recommended)

1. **Neon Pooled URL** on Vercel (`-pooler` + `pgbouncer=true`) — see [NEON-CLOUD-SETUP.md](./NEON-CLOUD-SETUP.md)  
2. **Neon paid** — Scale-to-zero off → lagbhag zero cold disconnect  
3. **Vercel Pro** (optional) — zyada concurrent functions, 60s timeout  

## Limits (hard)

- Leads list: max **5000** per request  
- Lead import: max **500** rows  
- Employee import: max **200** rows  
- API pages: max **100** items  

## Health check

`GET /api/health` — DB connected hona chahiye.

---

**Note:** 100% “never crash” koi bhi SaaS guarantee nahi kar sakta — ye design **graceful failure** deta hai: error message, retry, rate limit — poora server down nahi.
