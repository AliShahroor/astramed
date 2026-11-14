# ASTRAMED

Explainable health-monitoring and decision-support **prototype** for astronauts on long-duration missions, by Team Code Blue for the 2026 NASA Space Apps Challenge *Create Health Monitoring Software for Astronauts on Space Missions*.

> Simulated data only. Not a medical device; does not diagnose or replace a flight surgeon.

ASTRAMED turns measurements into **Explainable Health Cards**: each finding is computed from app state and shows what changed, the personal baseline or NASA limit it is compared with, the window and persistence, why it was flagged, limits of the interpretation, a next check, and a link to a packaged NASA evidence record.

## Features
- **My Health**: mission context, ranked findings, Explainable Health Card, interactive trends (7/14/30 days/full mission), NASA hazard filters, log-a-reading with validation.
- **Crew**: minimal shared status, rule-based notifications, acknowledge and check-in, sharing preference, communication-delay context.
- **Countermeasures**: illustrative activity library (NASA ISS equipment context), a real reaction-time assessment (`performance.now()`), progress and rest-day-safe streaks.
- Demo scenarios (Nominal / Fatigue observation / Environmental concern), global environment selector, as-of-day slider, optional spoken notifications, reset.
- Offline: service worker + manifest (see limitations).

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine + integration tests
npm run typecheck && npm run lint
npm run build && npm run preview
```
Stack: React, TypeScript, Vite, Tailwind CSS 3, Recharts, Lucide, Vitest. No backend.

## Data provenance
Astronauts, baselines and measurements are **synthetic** (seeded, reproducible). NASA-derived items are limited to the CO₂ one-hour limit (3 mmHg, V2 6004) and the 600 mSv career dose reference (V1 4030). Everything else is a Code Blue prototype rule, labelled as such. Details: `docs/scientific-sources/evidence-mapping.md`, `docs/implementation/`, `docs/validation/`.

## NASA sources
Human Research Program hazards, Spaceflight Standard Measures, NASA-STD-3001 via OCHMO technical briefs (CO₂, radiation), HRR sleep risk and PVT task pages, bone and exercise-countermeasure pages. NASA OSDR is a future source and is not used.

## Deploy
Static build in `dist/` (e.g. Vercel: framework Vite, build `npm run build`, output `dist`). Routing is hash-based, so direct links work on static hosting.

## Team
Team Code Blue. See `docs/submission/ai-disclosure.md` for AI-assistance disclosure.
