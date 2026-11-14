# Synthetic data

Crew (fictional): Alex Moreno, Sana Idris, Jonas Lindqvist, Mei-Lin Chou on the fictional mission “Meridian-1” (Mars transit), 94 days. No real astronaut data are used.

Series are generated in `src/engine/scenarioData.ts` from a seeded PRNG (`mulberry32`), so every load is identical.
- Baseline + small noise + ±1% slow drift per indicator.
- Scenario B: Alex’s sleep ramps down from Day 50, reaction latency up from Day 66, heart rate up from Day 60; Day-94 values are **pinned** (72 bpm, 5.7 h, 351 ms) for a reproducible demonstration. Jonas gets a mild heart-rate rise.
- Scenario C: cabin CO₂ one-hour average pinned at 2.8 / 3.4 / 4.1 mmHg on Days 92–94, otherwise about 2 mmHg.
- Radiation: about 1.8 mSv/day (~169 mSv at Day 94). Bone: a gentle linear estimate with noise; no reference trajectory.
Preflight baselines are seeded values labelled simulated.
Live data created in the app (manual entries, assessments, activity completions) is stored in `localStorage` and distinguished in charts (amber points).
