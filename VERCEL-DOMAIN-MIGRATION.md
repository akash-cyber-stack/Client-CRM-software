# Purani URL → Nayi website

| URL | Status |
|-----|--------|
| **https://ar-crm-iota-pi.vercel.app** | ✅ Nayi site (latest code + env) — **yahi use karein** |
| **https://ar-crm-iota.vercel.app** | ⚠️ Purana deploy — alag Vercel project (`argroupads` → **ar-crm**) |

Dono URLs alag Vercel projects par hain. Code GitHub par ek hi repo hai; purani URL tab tak purani rahegi jab tak **ar-crm** project latest code deploy na kare.

---

## Option A — Purani URL ko nayi site par redirect (recommended)

Repo mein redirect add ho chuka hai (`vercel.json` + `index.html`). **Sirf ek baar** argroupads account se redeploy karein:

1. [vercel.com](https://vercel.com) → team **argroupads-eductions**
2. Project **ar-crm**
3. **Settings → Git** → repo `akash-cyber-stack/Client-CRM-software`, branch **`main`**
4. **Deployments** → **Redeploy** → **Use existing Build Cache** = **OFF**
5. Test: https://ar-crm-iota.vercel.app/login → browser **ar-crm-iota-pi.vercel.app/login** par khulega

---

## Option B — Purani URL par hi naya UI (redirect nahi)

Agar aap chahte hain ki `ar-crm-iota.vercel.app` par hi naya app chale (URL change na ho):

1. **ar-crm** → **Environment Variables** (Production) — same values as **ar-crm-iota** project:
   - `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `NODE_ENV=production`
   - `FRONTEND_URL` = `https://ar-crm-iota.vercel.app`
   - webhook secrets (see `scripts/vercel-env.example`)
2. **Redeploy** from `main` (cache off)
3. `vercel.json` redirect hata dena agar same-domain chahiye (optional; abhi redirect purani → pi hai)

---

## Option C — Domain naye project par shift

Personal team par project **ar-crm-iota** already has **ar-crm-iota-pi.vercel.app**.

1. **argroupads → ar-crm → Settings → Domains** → remove `ar-crm-iota.vercel.app`
2. **akashpandeyweconnect → ar-crm-iota → Domains** → add `ar-crm-iota.vercel.app`
3. Purani bookmark bhi nayi deployment par point karegi

---

## Abhi ke liye (bina redeploy)

Direct nayi site use karein:

**Login:** https://ar-crm-iota-pi.vercel.app/login

**Health:** https://ar-crm-iota-pi.vercel.app/api/health
