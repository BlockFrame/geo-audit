# Deployment Checklist: Vercel + Render

## Backend (Render)

### ✅ render.yaml Configuration
- [x] Python 3.11.9 runtime
- [x] Uvicorn startup command
- [x] /health endpoint

### ✅ Environment Variables on Render Dashboard
Go to: https://dashboard.render.com → Select Service → Environment

Required variables:
```
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=<your-key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free
OPENROUTER_REQUIRE_FREE=true
DISCORD_LINK=https://discordapp.com/users/928974512593203202
FRONTEND_ORIGINS=https://your-vercel-domain.vercel.app
FRONTEND_ORIGIN_REGEX=https://.*\.vercel\.app
```

### ✅ Backend Health Check
Test endpoint:
```bash
curl https://geo-audit-app-backend-xxxxx.onrender.com/health
```

Expected response: `{"status": "ok"}`

---

## Frontend (Vercel)

### ✅ package.json Dependencies
Should include:
```json
{
  "@vercel/analytics": "^1.2.2",
  "@vercel/speed-insights": "^1.0.11"
}
```

Run:
```bash
npm install
```

### ✅ Environment Variables on Vercel Dashboard
Go to: https://vercel.com/dashboard → Project Settings → Environment Variables

**For Production Environment:**
```
BACKEND_URL=https://geo-audit-app-backend-xxxxx.onrender.com/copilotkit
BACKEND_AGUI_URL=https://geo-audit-app-backend-xxxxx.onrender.com/agui/default
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/rossi-stefano/
NEXT_PUBLIC_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSeOOb2vsD94lpUBTBlHX2S_wgFYOlMJ2jzXTtZ8WUzYhcuqMg/viewform?usp=dialog
```

**For Development (Preview/Development branch):**
```
BACKEND_URL=http://127.0.0.1:8000/copilotkit
BACKEND_AGUI_URL=http://127.0.0.1:8000/agui/default
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/rossi-stefano/
NEXT_PUBLIC_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSeOOb2vsD94lpUBTBlHX2S_wgFYOlMJ2jzXTtZ8WUzYhcuqMg/viewform?usp=dialog
```

### ✅ vercel.json
Should exist with:
```json
{
  "framework": "nextjs",
  "nodejs": "20",
  "buildCommand": "npm run build",
  "analytics": { "enabled": true }
}
```

### ✅ Deployment
Redeploy to apply new env vars:
```bash
cd frontend
vercel deploy --prod
```

Or trigger redeploy via Vercel Dashboard:
1. Settings → Git
2. Find latest commit
3. Click "Redeploy"

---

## CORS Configuration (Render Backend)

In `backend/main.py`, verify CORS is correctly set:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-domain.vercel.app",
        "https://*.vercel.app",  # or FRONTEND_ORIGINS env var
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Or use environment variable from `render.yaml`:
```python
allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
```

---

## Testing Deployment

### 1. Frontend Health
```bash
# Visit your Vercel URL
curl https://your-vercel-domain.vercel.app
```

Check:
- Page loads
- No 404s
- CSS and JS load correctly

### 2. Backend Health
```bash
# Test backend endpoint
curl https://geo-audit-app-backend-xxxxx.onrender.com/health
```

Expected: `{"status": "ok"}`

### 3. API Bridge
In browser console on your Vercel frontend:
```js
// Test CopilotKit endpoint
fetch('/api/copilotkit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
.then(r => r.json())
.then(console.log)
```

Should reach backend without CORS errors.

### 4. Analytics
On Vercel frontend:
```js
// Test Vercel Analytics
window.va?.track('test_event', { test: true })
console.log('Analytics loaded:', !!window.va)
```

Expected: `Analytics loaded: true`

---

## Monitoring

### Vercel Dashboard
- https://vercel.com/dashboard
- Monitor: Deployments, Analytics, Logs

### Render Dashboard
- https://dashboard.render.com
- Monitor: Services, Environment, Logs

### Check Logs

**Vercel:**
1. Project → Deployments → Latest → Logs (Build & Runtime)

**Render:**
1. Services → geo-audit-app-backend → Logs

---

## Troubleshooting

### "Backend unreachable" error
✅ Check BACKEND_URL in Vercel env vars (must be full HTTPS URL)
✅ Verify backend is running: `curl https://render-url/health`
✅ Check CORS: `FRONTEND_ORIGINS` on Render must include Vercel domain

### "Analytics not tracking"
✅ Check: `@vercel/analytics@^1.2.2` installed
✅ Check: `<Analytics />` in layout.tsx
✅ Check: Vercel project has analytics enabled
✅ Wait 10 minutes for first data to sync

### "CopilotKit errors"
✅ Check: BACKEND_URL points to /copilotkit path
✅ Check: BACKEND_AGUI_URL points to /agui/default
✅ Check: Backend logs for CORS errors

### "Render backend cold start"
✅ Render spins down free tier → first request takes 30s
✅ Upgrade plan or use pings to keep alive
✅ Or: Uptime monitoring → https://uptimerobot.com

---

## Environment Variable Quick Reference

| Variable | Local | Production | Where |
|----------|-------|------------|-------|
| `BACKEND_URL` | `http://127.0.0.1:8000/copilotkit` | `https://render-url/copilotkit` | Vercel Env |
| `BACKEND_AGUI_URL` | `http://127.0.0.1:8000/agui/default` | `https://render-url/agui/default` | Vercel Env |
| `LLM_PROVIDER` | `openrouter` | `openrouter` | Render Env |
| `OPENROUTER_API_KEY` | from .env | same value | Render Env |
| `DISCORD_LINK` | in .env | same value | Render Env |
| `FRONTEND_ORIGINS` | n/a | `https://*.vercel.app` | Render Env |

---

## Next: After Deployment

1. **Test audit flow end-to-end**
   - Go to https://your-vercel-frontend.vercel.app
   - Run audit
   - Check report generation
   - Export with new F7 features (business modes)

2. **Monitor analytics**
   - Go to https://vercel.com → Project → Analytics
   - Wait 10-15 minutes for data
   - Should see custom events (audit_completed, export_downloaded, etc.)

3. **Verify new features**
   - Check export dropdown has modes (verbose/executive/checklist)
   - Check audience selector (executive/marketing/technical)
   - Check brand template input works
   - Export PDF and verify PDF header shows metadata

---

## Common Ports

- Local backend: `:8000` (Uvicorn)
- Local frontend: `:3000` (Next.js)
- Render backend: HTTPS only
- Vercel frontend: HTTPS only

**Never use HTTP in production CORS settings.**
