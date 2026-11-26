# Fintness Finserv — Client Feedback Experience

A short, mobile-first feedback journey: name → three emoji ratings (with reasons when a rating is below 4) → review → submit → thank-you.
Answers are saved to **Google Sheets** through a **Google Apps Script** web app.

```
app/        React 19 + TypeScript + Tailwind v4 + Motion (Framer Motion) + Lucide
backend/    Code.gs (Apps Script API), appsscript.json, DEPLOYMENT.md, tests + local mock API
assets/     Original logo
```

## Run locally

```bash
# 1. Local stand-in for the Google backend. It runs the real Code.gs with Google services mocked.
node backend/test/mock-server.mjs          # http://localhost:8787/exec   (GET /rows shows the stored rows)

# 2. The app
cd app
cp .env.example .env.local                 # then set VITE_FEEDBACK_ENDPOINT=http://localhost:8787/exec
npm install
npm run dev                                # http://localhost:5173 (also printed with a LAN URL for phones)
```

Try the failure paths with `MOCK_MODE=fail`, `MOCK_MODE=network` or `MOCK_DELAY_MS=4000` on the mock server.

## Deploy on Vercel

The Vercel config is [`app/vercel.json`](app/vercel.json). It runs a Vite build on Node 22 and serves `dist`. It also adds long-lived caching for hashed assets and security headers (CSP, nosniff, no framing).

1. Go to Vercel → **Add New → Project** and import this GitHub repo. Set **Root Directory = `app`** and leave every other setting at its default.
2. Click **Deploy**. The site goes live straight away.
   Until the backend is connected, the journey works end to end, but **Submit** shows *"The feedback service isn't connected yet"*. Nothing pretends to succeed.
3. **Connecting the backend later:**
   1. Deploy the Apps Script ([backend/DEPLOYMENT.md](backend/DEPLOYMENT.md)).
   2. In Vercel, open **Settings → Environment Variables**.
   3. Add `VITE_FEEDBACK_ENDPOINT` = your `/exec` URL (for Production and Preview).
   4. Open **Deployments → ⋯ → Redeploy**. Vite reads the variable at build time, so you need to redeploy.

> The CSP already allows `script.google.com` and `script.googleusercontent.com`. If you ever move the backend somewhere else, add that domain to `connect-src` in `app/vercel.json`.

## Tests

```bash
node --test backend/test/        # backend validation, sanitising, de-duplication, sheet format (10 tests)
```

## Design system (from fintness.in)

| Token | Value |
| --- | --- |
| Display type | Playfair Display (italic for emphasis) |
| UI type | Geist |
| Brand / accent | `#0066FF` / `#00B2FF` |
| Ink / navy (logo) | `#0B1526` / `#15355C` |
| Mist / cloud | `#E9EFF8` / `#F5F8FC` |
| Easing | `cubic-bezier(0.23, 1, 0.32, 1)` everywhere (`--ease-out`) |

Tokens are in [app/src/index.css](app/src/index.css). Questions, reasons and emoji levels are in [app/src/data/feedback.ts](app/src/data/feedback.ts). If you change the reason lists, change `CONFIG.REASONS` in `backend/Code.gs` to match.

## Architecture notes

- **State:** a single `useReducer` ([state/feedbackReducer.ts](app/src/state/feedbackReducer.ts)). Moving between steps never loses answers. If a rating goes from <4 to ≥4, its reasons are kept and simply not sent, so switching back restores them.
- **Submission:** [lib/api.ts](app/src/lib/api.ts) posts JSON as `text/plain` (Apps Script can't answer CORS preflight). It uses a 20s timeout and retries network failures once. That's safe because the same `submissionId` is used again and the server de-duplicates it. The app shows success **only** when the server confirms the row was written.
- **Double taps:** a ref lock plus a disabled button plus server-side de-duplication.
- **Motion:** directional step swaps (forward slides left, back slides right). Each emoji has its own reaction (shake, tilt, squash, hop, spin), and each category has its own sparkle style (dots, stars, rings). The reason panel expands and collapses by height. The success screen draws the check, then fires confetti. `prefers-reduced-motion` keeps the fades and drops movement, sparkles and confetti.
- **Mobile:** sticky thumb-zone CTA that respects the safe area, 16px inputs (no iOS zoom), `100dvh`, no tap highlight, hover effects only on devices that can hover, `touch-action: manipulation`.
