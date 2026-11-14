import type { Assessment, Baseline, TrialRecord } from '../types';
import { mean, median, pctChange } from './stats';

/** Prototype reaction-time protocol. Parameters are Code Blue design choices, not NASA PVT specifications. */
export const RT_PROTOCOL = {
  version: 'RT-PROTO-1.0',
  practiceTrials: 2,
  scoredTrials: 6,
  minValidTrials: 4,
  waitMinMs: 1500,
  waitMaxMs: 4500,
  /** responses faster than this after the stimulus are treated as anticipatory (invalid) */
  anticipatoryBelowMs: 100,
  timeoutMs: 2000,
};

export function classifyResponse(latencyMs: number): TrialRecord {
  if (!Number.isFinite(latencyMs) || latencyMs < 0) return { kind: 'false_start' };
  if (latencyMs < RT_PROTOCOL.anticipatoryBelowMs) return { kind: 'anticipatory', latencyMs };
  if (latencyMs > RT_PROTOCOL.timeoutMs) return { kind: 'timeout', latencyMs };
  return { kind: 'valid', latencyMs };
}

export type SummaryResult =
  | { ok: true; assessment: Omit<Assessment, 'id' | 'astronautId' | 't'> }
  | { ok: false; reason: string; validCount: number };

export function summarizeTrials(trials: TrialRecord[], baseline?: Baseline): SummaryResult {
  const valid = trials.filter((t) => t.kind === 'valid' && t.latencyMs !== undefined).map((t) => t.latencyMs!);
  const count = (k: TrialRecord['kind']) => trials.filter((t) => t.kind === k).length;
  if (valid.length < RT_PROTOCOL.minValidTrials) {
    return { ok: false, reason: `Only ${valid.length} valid trials; at least ${RT_PROTOCOL.minValidTrials} are needed to record a result.`, validCount: valid.length };
  }
  const med = median(valid)!;
  return {
    ok: true,
    assessment: {
      protocol: RT_PROTOCOL.version,
      medianMs: Math.round(med),
      meanMs: Math.round(mean(valid)!),
      validCount: valid.length,
      invalidCount: trials.length - valid.length,
      falseStarts: count('false_start'),
      anticipatory: count('anticipatory'),
      timeouts: count('timeout'),
      trials,
      baselineMs: baseline?.value,
      percentVsBaseline: baseline ? pctChange(Math.round(med), baseline.value) : null,
    },
  };
}
