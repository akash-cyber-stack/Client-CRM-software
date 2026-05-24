# Vercel purana UI dikh raha hai? (Fix in 2 minutes)

## Problem

| Localhost (sahi) | ar-crm-iota.vercel.app (galat) |
|------------------|--------------------------------|
| "Tap a **blue bar** (Leads)…" | "Tap to view **employees** →" |
| Bar click → `/employees/.../performance` | Employees list only |
| Employees row → **Performance** link | Sirf Edit |
| Notification **Refresh** works | Purana code, refresh broken |

**Reason:** `ar-crm-iota.vercel.app` abhi **purana JavaScript** serve kar raha hai. GitHub par naya code hai, lekin **argroupads → ar-crm** project ne latest deploy nahi kiya.

---

## Fix (argroupads Vercel account)

1. Login: [vercel.com](https://vercel.com) → team **argroupads-eductions**
2. Project: **ar-crm**
3. **Settings → Git**
   - Repository: `akash-cyber-stack/Client-CRM-software`
   - Production branch: **`main`**
4. **Deployments** → top deployment → **⋯** → **Redeploy** → check **Use existing Build Cache** = **OFF**
5. Wait until **Ready** (1–3 min)
6. Browser: **Ctrl + Shift + R** on https://ar-crm-iota.vercel.app

---

## Verify deploy succeeded

Sidebar bottom par **`build xxxxxxx`** (7-letter git hash) dikhna chahiye — `local` nahi.

Dashboard par:
- Text: **"Tap a blue bar (Leads) to open that employee's performance"**
- Employees table: **Performance** link (sales employees only, not Super Admin)

---

## Primary URL (naya app — abhi use karein)

**https://ar-crm-iota-pi.vercel.app/login**

Purani `ar-crm-iota.vercel.app` ko is par lane ke liye **ar-crm** ko `main` se redeploy karein (redirect code repo mein hai). Details: [VERCEL-DOMAIN-MIGRATION.md](./VERCEL-DOMAIN-MIGRATION.md)

---

## After redeploy still old UI?

- Wrong Vercel project open ho sakta hai
- Browser cache: Incognito window try karo
- Confirm deployment commit = latest on [GitHub main](https://github.com/akash-cyber-stack/Client-CRM-software/commits/main)
