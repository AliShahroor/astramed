# Scientific methodology

All astronaut measurements are **synthetic**. Calculations are deterministic and live in `src/engine/` (no calculations in JSX).

## Baseline comparison
`percent change = (current − baseline) / baseline × 100`; returns “not available” when the baseline is zero, missing or non-finite (`pctChange`). Interpretation depends on the indicator (e.g. higher reaction latency = slower; higher sleep is not assumed better).
Baselines are seeded per astronaut, labelled **simulated**, with a stored sample count (14 sessions; 10 for reaction time).

## Statuses
`Nominal`, `Review`, `Alert`, `Insufficient data`. Indicators with no rule are shown as “Trend only”, never “Nominal”.
Only a NASA-derived limit exceedance produces **Alert**. Prototype rules can only produce **Review**.

## Rules
| Rule | Origin | Logic | Insufficient when |
|---|---|---|---|
| `co2_exceeds_limit` | NASA-derived (V2 6004) | latest one-hour average > 3 mmHg → Alert; no trend needed | no reading, or reading > 2 days old |
| `rt_slowing` | Prototype | last 3 assessments each ≥ 10% above baseline → Review | < 3 assessments or latest > 7 days old |
| `sleep_reduced` | Prototype | mean of last 7 days (≥ 5 nights) ≥ 15% below baseline → Review | < 5 nights in window |
| `hr_elevated` | Prototype | mean of last 5 days (≥ 3 days) ≥ 10% above baseline → Review | < 3 days in window |
| radiation | NASA reference, informational | career dose utilization = dose / 600 mSv | no/stale dosimetry (> 3 days) |

The 10%, 15% and 10% thresholds are demonstration parameters. NASA provides no cutoff for these measures.
No confidence percentage is displayed; uncertainty is described by sample counts, data sources and rule origin.

## Aggregation
Mean for physiological series, sum for activity (so completed sessions add to the day), last value for CO₂, cumulative dose and bone estimate.

## Reaction-time protocol `RT-PROTO-1.0`
2 practice trials (not scored) + 6 scored trials; random 1.5–4.5 s wait; timed with `performance.now()`. Invalid: false start (response before stimulus), anticipatory (< 100 ms), timeout (> 2000 ms), recorded separately. Needs ≥ 4 valid trials to save. Result = median of valid trials. These parameters are design choices, not NASA PVT specifications.

## Environment selector
Changes context (gravity, communication delay, priorities) only. Reference limits and rules are unchanged because no verified environment-specific limit is available.

## Crew notification policy `notify-policy-1.0`
Alert-level finding → notification (cabin alerts once, for the cabin). Two or more simultaneous Review findings for one astronaut → attention notification. A single Review stays private. Text never contains measurements.
