# Testing

Commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

Automated (`tests/engine.test.ts`, vitest, 19 tests): percent change and zero/missing baselines; median; unit conversion and mismatch; determinism; pinned demo values; Scenario B finding values (351 vs 285, 23.2%); Scenario A produces no findings on any day for any astronaut; Scenario C CO₂ alert with 1.1 mmHg exceedance; insufficient data early in the mission; radiation never alerts; all cited evidence ids exist; manual CO₂ reading → alert; live assessment resolves/keeps the reaction-time finding; invalid/duplicate readings rejected; notification policy; reaction-trial classification and summary.

Manual browser checks performed (built-in browser, dev server): My Health renders and the health card opens; hazard filter + CO₂ chart with NASA limit line; scenario switch updates findings and crew notifications; a full reaction-time run (2 practice + 6 scored trials, driven by synthetic key events), saving the result, and the reaction-time finding resolving on My Health; no console errors; no horizontal overflow at 1280 px and 390 px.

**Not verified:** offline/service-worker behaviour (the built-in browser pane refused to register the service worker, so it was not tested); voice playback; real human timing accuracy; keyboard/screen-reader audit; cross-browser behaviour.
