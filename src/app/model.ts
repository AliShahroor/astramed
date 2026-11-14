import { ASTRONAUTS, ASTRONAUT_BY_ID, MISSION } from '../data/astronauts';
import { INDICATORS } from '../data/indicators';
import { evaluate, type Evaluation } from '../engine/rules';
import { deriveNotifications } from '../engine/notifications';
import { getScenarioData } from '../engine/scenarioData';
import { groupByIndicator } from '../engine/series';
import { dayEnd } from '../engine/stats';
import { convertToCanonical } from '../engine/units';
import type {
  Assessment, CrewNotification, IndicatorId, Measurement, ScenarioId, ScenarioUserData,
} from '../types';

export const emptyUserData = (): ScenarioUserData => ({
  manual: [], assessments: [], acks: {}, checkins: [], completions: [], history: [], liveCount: 0,
});

export interface ModelInput {
  scenarioId: ScenarioId;
  asOfDay: number;
  user: ScenarioUserData;
}

export const assessmentToMeasurement = (a: Assessment): Measurement => ({
  id: `live-${a.id}`, indicator: 'rt', subject: a.astronautId, value: a.medianMs, unit: 'ms', t: a.t, source: 'cognitive_assessment',
});

/** Mission-clock timestamp for the next live entry (simulated clock, minutes after 22:00 on the current day). */
export const liveTimestamp = (liveCount: number) => dayEnd(MISSION.currentDay) - 119 + Math.min(liveCount, 100);

export interface AstronautModel {
  measurements: Measurement[];
  evaluation: Evaluation;
}

export interface Model {
  byAstronaut: Record<string, AstronautModel>;
  notifications: CrewNotification[];
  asOfDay: number;
  asOfT: number;
}

/** Every page derives from this single pure function. */
export function buildModel({ scenarioId, asOfDay, user }: ModelInput): Model {
  const base = getScenarioData(scenarioId);
  const asOfT = dayEnd(asOfDay);
  const byAstronaut: Record<string, AstronautModel> = {};
  for (const a of ASTRONAUTS) {
    const all: Measurement[] = [
      ...base.byAstronaut[a.id],
      ...base.cabin,
      ...user.manual.filter((m) => m.subject === a.id || m.subject === 'cabin'),
      ...user.assessments.filter((x) => x.astronautId === a.id).map(assessmentToMeasurement),
    ].filter((m) => m.t <= asOfT);
    // cabin readings: simulated and manual share one series per astronaut view
    const grouped = groupByIndicator(all);
    const evaluation = evaluate({ astronautId: a.id, baselines: ASTRONAUT_BY_ID[a.id].baselines, obs: grouped, asOfDay });
    byAstronaut[a.id] = { measurements: all, evaluation };
  }
  const names = Object.fromEntries(ASTRONAUTS.map((a) => [a.id, a.name]));
  const notifications = deriveNotifications(
    Object.fromEntries(Object.entries(byAstronaut).map(([id, m]) => [id, m.evaluation.findings])), asOfT, names,
  );
  return { byAstronaut, notifications, asOfDay, asOfT };
}

export type ReadingResult = { ok: true; measurement: Omit<Measurement, 'id' | 'source'> } | { ok: false; error: string };

export function validateReading(
  indicator: IndicatorId, value: number, unit: string, day: number, minute: number, subject: string, existing: Measurement[],
): ReadingResult {
  const def = INDICATORS[indicator];
  if (!def.loggable) return { ok: false, error: `${def.label} cannot be entered manually.` };
  if (!Number.isFinite(value)) return { ok: false, error: 'Enter a numeric value.' };
  if (!Number.isInteger(day) || day < 1 || day > MISSION.currentDay) return { ok: false, error: `Mission day must be between 1 and ${MISSION.currentDay}.` };
  if (!Number.isInteger(minute) || minute < 0 || minute > 1439) return { ok: false, error: 'Time is not valid.' };
  const conv = convertToCanonical(indicator, value, unit);
  if (!conv.ok) return { ok: false, error: conv.error };
  const [lo, hi] = def.plausible;
  if (conv.value < lo || conv.value > hi)
    return { ok: false, error: `${Math.round(conv.value * 100) / 100} ${def.unit} is outside the plausible data-entry range (${lo} to ${hi} ${def.unit}). This is a data-quality check, not a medical limit.` };
  const t = (day - 1) * 1440 + minute;
  const rounded = Math.round(conv.value * 1000) / 1000;
  if (existing.some((m) => m.indicator === indicator && m.t === t && m.subject === subject && m.value === rounded))
    return { ok: false, error: 'An identical reading already exists for this time.' };
  return { ok: true, measurement: { indicator, subject, value: rounded, unit: def.unit, t } };
}
