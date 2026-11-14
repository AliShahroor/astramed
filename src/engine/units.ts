import type { IndicatorId } from '../types';

/** factor converts the listed unit into the indicator's canonical unit */
const FACTORS: Partial<Record<IndicatorId, Record<string, number>>> = {
  hr: { bpm: 1 },
  sleep: { h: 1, min: 1 / 60 },
  rt: { ms: 1, s: 1000 },
  activity: { min: 1, h: 60 },
  co2: { mmHg: 1, kPa: 7.50062 },
  spo2: { '%': 1 },
  bp_sys: { mmHg: 1, kPa: 7.50062 },
  bp_dia: { mmHg: 1, kPa: 7.50062 },
  radiation: { mSv: 1 },
  bone: { '%': 1 },
};

export type ConvertResult = { ok: true; value: number } | { ok: false; error: string };

export function convertToCanonical(indicator: IndicatorId, value: number, unit: string): ConvertResult {
  const f = FACTORS[indicator]?.[unit];
  if (f === undefined) return { ok: false, error: `Unit "${unit}" is not valid for this indicator.` };
  if (!Number.isFinite(value)) return { ok: false, error: 'Value must be a number.' };
  return { ok: true, value: value * f };
}
