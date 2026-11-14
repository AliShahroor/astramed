import { fmt } from './stats';

export interface ChangeTemplateInput {
  metric: string;
  current: number;
  baseline: number;
  unit: string;
  percent: number;
  windowText: string;
  higherMeans: string;
  decimals?: number;
}

/** Deterministic sentence assembled from calculated values. */
export function explainChange(i: ChangeTemplateInput): string {
  const d = i.decimals ?? 0;
  const up = i.percent > 0;
  return `Your ${i.metric} is ${fmt(i.current, d)} ${i.unit} against a personal baseline of ${fmt(i.baseline, d)} ${i.unit}, ${fmt(Math.abs(i.percent), 1)}% ${up ? 'higher' : 'lower'}, based on ${i.windowText}.${up ? ` Higher values here mean ${i.higherMeans}.` : ''}`;
}

/** Spoken text is a fixed, cautious restatement of the same finding. No separate medical interpretation. */
export const SPOKEN = {
  rt: 'Attention. Your recent reaction-time responses are slower than your personal baseline. Please review the health finding and consider completing a reassessment.',
  sleep: 'Attention. Your recent sleep duration is shorter than your personal baseline. Please review the health finding.',
  hr: 'Attention. Your recent resting heart rate is higher than your personal baseline. Please review the health finding and repeat the measurement under comparable conditions.',
  co2: 'Alert. The cabin carbon dioxide one-hour average is above the NASA reference limit. Please verify the reading and follow environmental control procedures.',
};
