# Architecture

```
src/
  types/        shared TypeScript types
  data/         indicators + hazards, evidence library, astronauts/scenarios/environments, countermeasures
  engine/       pure domain logic: stats, units, series, rules, templates, assessments, notifications, scenarioData
  app/          model.ts (pure buildModel), store.tsx (reducer + localStorage), App shell
  components/   layout, health, evidence, assessments, shared
  pages/        MyHealth, Crew, Countermeasures
public/         manifest, icon, service worker
tests/          vitest engine + integration tests
```
`buildModel` is the single derivation: scenario data + user data (manual entries, assessments) → findings → notifications. Every page reads from it, so the astronaut, scenario, and as-of day are consistent everywhere.
State persists in `localStorage` key `astramed.v1` (per-scenario user data). No backend.
