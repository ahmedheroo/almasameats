# Deployment Guide

## Render (Recommended - Free Tier, Persistent JSON Storage)

Render's free tier provides a persistent filesystem, so the JSON files survive restarts.

### Setup

1. Push the repo to GitHub
2. Go to https://render.com and create a new **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name:** freebuff-pos
   - **Environment:** Docker
   - **Region:** Qatar (closest to KSA)
   - **Plan:** Free
5. Render auto-detects the Dockerfile and deploys

### URLs

- **Web app:** `https://freebuff-pos.onrender.com`
- **API:** Same URL (Express serves both)
- **Login:** admin / 123456

### Limitations (Free Tier)

- Sleeps after 15 min of inactivity (cold start ~30s on next request)
- 512MB RAM, 0.1 CPU
- For a shop POS this is acceptable - the first load after idle takes a moment

### Keeping it Always-On

Upgrade to Render's paid tier ($7/mo) for 24/7 uptime, or use Railway (~$5/mo).

---

## Vercel (Serverless - No Persistent Storage)

Vercel runs your Express app as serverless functions. The JSON files do NOT persist between invocations.

**Use this ONLY if you add a real database (SQLite on Vercel KV, or external DB).**

### Setup

1. Push to GitHub
2. Import project in Vercel dashboard
3. Vercel auto-detects `vercel.json`
4. Deploy

### Data Persistence Problem

Each serverless function invocation gets a fresh filesystem. The `data/` directory resets every time. You MUST migrate to a database for this to work.

---

## GitHub Pages (Frontend ONLY)

Only the frontend can deploy here. The backend must run elsewhere.

1. `ng build --configuration production`
2. Enable GitHub Pages in repo settings, source: `gh-pages` branch or `/dist/freebuff-pos/browser`
3. Update the Angular proxy/API base URL to point to your backend server

---

## Local Development

```bash
npm start          # Runs Express server only (port 3000)
npm run client     # Runs Angular dev server (port 4200)
npm run start:full # Runs both concurrently (dev only)
```

The Angular dev server proxies `/api` to `http://localhost:3000` via `proxy.conf.json`.

## Production Build

```bash
npm run build      # Builds Angular to dist/freebuff-pos/browser
npm start          # Starts Express serving static files + API
```

Visit `http://localhost:3000` - Express serves the built Angular app and handles all API routes.
