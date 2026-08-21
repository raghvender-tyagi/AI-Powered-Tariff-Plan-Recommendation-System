# Tariff Twin — Frontend

React 19 + Vite + TailwindCSS v4 + Recharts + Framer Motion + Zustand client
for the AI-Powered Tariff Plan Recommendation System.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint
```

The backend must be running (`npm --prefix backend start`). Point the client
at it via `.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## No demo data

This client talks **only** to the real API. There is no mock/offline data
path: the 25-plan catalogue, the K-Means personas and every match score come
from the backend, and a failed request renders an error state rather than
invented values.

Consequently:

* `src/api/mockData.js` has been removed.
* `src/lib/scoring.js` — the old client-side mirror of the scoring formula —
  has been removed too. Ranking exists in exactly one place, the backend
  recommendation engine. The What-If simulator posts to
  `POST /api/recommendations/what-if` instead of estimating in the browser.

## Project structure

```
src/
  api/            one axios module per resource, all hitting the real API
  components/
    admin/        admin analytics, cluster explorer, batch-job status, model panel
    advisor/      the AI Advisor chat window (full page + floating widget)
    compare/      plan picker, backend-built comparison table, AI verdicts
    dashboard/    dashboard widgets + usage chart
    landing/      marketing/landing page sections
    layout/       app shell, nav, floating chat button
    onboarding/   step wizard + AI analysis sequence
    recommendations/  plan cards, match-score breakdown, why-this-plan drawer
    shared/       persona card, journey timeline, category comparison
    simulator/    what-if sliders
    twin/         telecom twin gauges, account info, segment comparison
    ui/           design-system primitives (Button, Card, Badge, Drawer, Gauge…)
  lib/            formatting, plan-shape helpers, chart palette, hooks
  pages/          one file per route
  store/          Zustand app store (identity, profile, compare tray)
```

## Data shapes

`GET /api/plans` returns the catalogue plan shape:

```js
{
  _id: 'FLEX_3', planName: 'Flex 3', category: 'FLEX', categoryLabel: 'Flex',
  price: 169, validityDays: 28, differentiator: 'Unused-data rollover',
  allowanceType: 'personal', dailyDataGb: 1, monthlyDataGb: 30, dataGB: 30,
  members: null, employees: null, pricePerGb: 5.63,
  priceTier: 'budget', dataTier: 'moderate',
  clusterId: 0, persona: 'Moderate / General Users', benefits: [...]
}
```

A recommendation entry adds the engine's own output:

```js
{
  planId, rank, plan, matchPercent, rawScore,
  breakdown: { usageFit, budgetFit, personaMatch },
  explanation, explanationDetail: { reasons, contributions, formula }
}
```

`src/lib/planShape.js` holds the small helpers for reading these
(`categoryLabel`, `dailyData`, `coverageLabel`, `SCORE_DIMENSIONS`).

## Admin

`POST /api/auth/login` issues a JWT which `src/api/client.js` stores in
`sessionStorage` and attaches to every subsequent request. Credentials come
from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env`.
