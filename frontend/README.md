# Tariff Twin — Frontend

A premium, AI-SaaS frontend for the **AI-Powered Tariff Plan Recommendation System** (MERN stack), built with React 19, Vite, TailwindCSS v4, Recharts, Framer Motion and Zustand.

This is a **frontend-only rebuild**. It does not touch or assume any specific backend implementation — it talks to the REST API contract defined in the project's technical plan, and gracefully falls back to clearly-labeled demo data for any endpoint that isn't live yet, so the whole app is explorable before the backend exists.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## Connecting your real backend

Create `client/.env` (see `.env.example`):

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Every call in `src/api/*.js` targets the exact endpoints from the technical plan
(`GET /api/customers/:id`, `POST /api/recommendations/by-customer/:id`,
`POST /api/chat/message`, `GET /api/clusters`, `POST /api/admin/clusters/run`, …).
Once your Express server is live at that base URL and returns JSON, the app
will use real data automatically — no UI code changes required. The "Demo
data" badge shown around the app disappears once a screen is getting real
responses.

## Project structure

```
src/
  api/            axios wrappers per resource, each with a demo fallback
  components/
    admin/        admin analytics, cluster explorer, batch-job status
    advisor/      the AI Advisor chat window (full page + floating widget)
    compare/      plan picker, comparison table, AI verdict badges
    dashboard/    dashboard widgets + usage chart
    landing/      marketing/landing page sections
    layout/       app shell, nav, floating chat button
    onboarding/   step wizard + AI analysis loading sequence
    recommendations/  plan cards, match-score breakdown, why-this-plan drawer
    shared/       persona card, journey timeline, operator comparison
    simulator/    what-if sliders
    twin/         telecom twin gauges, contract info, plan health
    ui/           design-system primitives (Button, Card, Badge, Drawer, Gauge…)
  lib/            formatting, client-side scoring mirror, chart palette, hooks
  pages/          one file per route
  store/          Zustand app store (profile, recommendations, compare tray)
```

## Notes for whoever wires up the backend

- `src/lib/scoring.js` mirrors the backend's weighted-fit formula (section 6.4
  of the technical plan) purely so the **What-If Simulator** and onboarding
  flow can react instantly in the browser. It is explicitly labeled as an
  estimate in the UI and is superseded by the real API response as soon as
  it lands (see the simulator's "Synced with recommendation engine" badge).
- `src/api/mockData.js` holds all demo/fallback data. Nothing in it is real
  customer, operator, or pricing data — operator names are fictional demo
  brands, per the project's requirement not to fabricate real statistics.
- Admin routes assume JWT bearer auth exactly as specified (`POST
  /api/auth/login` → `{ token }`), stored in `sessionStorage` and attached
  to every subsequent request via `src/api/client.js`.
- No secrets, API keys, or environment values are hard-coded anywhere in the
  client bundle.
