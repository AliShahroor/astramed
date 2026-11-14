import { ASTRONAUTS, SCENARIOS, type Effect } from '../data/astronauts';
import type { IndicatorId, Measurement, ScenarioId, SourceType } from '../types';
import { gaussian, mulberry32, MIN_PER_DAY } from './stats';

export interface ScenarioData {
  byAstronaut: Record<string, Measurement[]>;
  cabin: Measurement[];
}

const cache = new Map<ScenarioId, ScenarioData>();
const DAYS = 94;

const ramp = (day: number, e?: { start: number; end: number; delta: number }) => {
  if (!e) return 0;
  if (day <= e.start) return 0;
  if (day >= e.end) return e.delta;
  return (e.delta * (day - e.start)) / (e.end - e.start);
};

const r = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** Deterministic simulated data. Same scenario always yields the same series. */
export function getScenarioData(id: ScenarioId): ScenarioData {
  const hit = cache.get(id);
  if (hit) return hit;
  const sc = SCENARIOS[id];
  const byAstronaut: Record<string, Measurement[]> = {};

  for (const a of ASTRONAUTS) {
    const rand = mulberry32(a.seed);
    const n = () => gaussian(rand);
    const eff: Effect = sc.effects[a.id] ?? {};
    const out: Measurement[] = [];
    let seq = 0;
    const push = (indicator: IndicatorId, day: number, minute: number, value: number, unit: string, source: SourceType) =>
      out.push({ id: `${a.id}-${indicator}-${seq++}`, indicator, subject: a.id, value, unit, t: (day - 1) * MIN_PER_DAY + minute, source });

    const b = a.baselines;
    const doseRate = 1.8 * (a.id === 'jonas' ? 1.02 : a.id === 'mei' ? 0.98 : 1);
    let dose = 0;
    for (let day = 1; day <= DAYS; day++) {
      const anchor = eff.anchors?.[day] ?? {};
      const drift = 1 + 0.01 * Math.sin(day / 11); // gentle natural drift, ±1%
      const hr = anchor.hr ?? r((b.hr!.value + ramp(day, eff.hr)) * drift + n() * 1.4, 0);
      push('hr', day, 390, hr, 'bpm', 'simulated_wearable');
      const sleep = anchor.sleep ?? r(b.sleep!.value + ramp(day, eff.sleep) + n() * 0.28, 1);
      push('sleep', day, 420, Math.max(2, sleep), 'h', 'simulated_wearable');
      push('spo2', day, 720, Math.min(100, r(b.spo2!.value + n() * 0.35, 1)), '%', 'simulated_wearable');
      push('bp_sys', day, 480, r(b.bp_sys!.value + n() * 2.5, 0), 'mmHg', 'simulated_wearable');
      push('bp_dia', day, 480, r(b.bp_dia!.value + n() * 1.8, 0), 'mmHg', 'simulated_wearable');
      push('activity', day, 1260, Math.max(0, r(b.activity!.value + n() * 9, 0)), 'min', 'simulated_wearable');
      dose += doseRate * (1 + n() * 0.04);
      push('radiation', day, 1200, r(dose, 1), 'mSv', 'simulated_environment');
      if ((day - 1) % 3 === 0) {
        const rt = anchor.rt ?? r((b.rt!.value + ramp(day, eff.rt)) * drift + n() * 7, 0);
        push('rt', day, 600, rt, 'ms', 'cognitive_assessment');
      }
      if (day % 7 === 0) push('bone', day, 1000, r(-0.0125 * day + n() * 0.08, 2), '%', 'simulated_estimate');
    }
    byAstronaut[a.id] = out;
  }

  const cabinRand = mulberry32(9090);
  const cabin: Measurement[] = [];
  for (let day = 1; day <= DAYS; day++) {
    const v = sc.co2Anchors[day] ?? r(2.0 + 0.25 * Math.sin(day / 6) + gaussian(cabinRand) * 0.1, 1);
    cabin.push({ id: `cabin-co2-${day}`, indicator: 'co2', subject: 'cabin', value: v, unit: 'mmHg', t: (day - 1) * MIN_PER_DAY + 840, source: 'simulated_environment' });
  }

  const data = { byAstronaut, cabin };
  cache.set(id, data);
  return data;
}
