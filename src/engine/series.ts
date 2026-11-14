import { INDICATORS } from '../data/indicators';
import type { IndicatorId, Measurement } from '../types';
import { dayOf } from './stats';

export interface DailyPoint {
  day: number;
  value: number;
  n: number;
  hasManual: boolean;
  hasLive: boolean;
}

export function sortObs(ms: Measurement[]): Measurement[] {
  return [...ms].sort((a, b) => a.t - b.t);
}

/** Daily aggregation according to each indicator's aggregation type. */
export function toDaily(indicator: IndicatorId, ms: Measurement[]): DailyPoint[] {
  const agg = INDICATORS[indicator].aggregate;
  const byDay = new Map<number, Measurement[]>();
  for (const m of sortObs(ms)) {
    if (m.indicator !== indicator) continue;
    const d = dayOf(m.t);
    byDay.set(d, [...(byDay.get(d) ?? []), m]);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, list]) => {
      const vals = list.map((m) => m.value);
      const value = agg === 'sum' ? vals.reduce((a, b) => a + b, 0) : agg === 'last' ? vals[vals.length - 1] : vals.reduce((a, b) => a + b, 0) / vals.length;
      return {
        day, value, n: list.length,
        hasManual: list.some((m) => m.source === 'manual'),
        hasLive: list.some((m) => m.source === 'cognitive_assessment' && m.id.startsWith('live-')),
      };
    });
}

export function groupByIndicator(ms: Measurement[]): Partial<Record<IndicatorId, Measurement[]>> {
  const out: Partial<Record<IndicatorId, Measurement[]>> = {};
  for (const m of ms) (out[m.indicator] ??= []).push(m);
  for (const k of Object.keys(out) as IndicatorId[]) out[k] = sortObs(out[k]!);
  return out;
}
