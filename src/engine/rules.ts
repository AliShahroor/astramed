import { CAREER_DOSE_LIMIT_MSV, CO2_LIMIT_MMHG } from '../data/evidence';
import { INDICATORS, INDICATOR_ORDER } from '../data/indicators';
import type { Baseline, HealthFinding, IndicatorId, IndicatorStatus, Measurement, SourceType, StatusId } from '../types';
import { toDaily } from './series';
import { dayOf, dayEnd, fmt, mean, pctChange, signed } from './stats';
import { SPOKEN, explainChange } from './templates';

export const RULE_VERSION = 'prototype-rules-1.0';

export interface EvalInput {
  astronautId: string;
  baselines: Partial<Record<IndicatorId, Baseline>>;
  /** observations already limited to <= asOfDay, sorted by time */
  obs: Partial<Record<IndicatorId, Measurement[]>>;
  asOfDay: number;
}

interface RuleOutcome { status: StatusId; note: string; finding?: HealthFinding }

/** Prototype thresholds. These are Code Blue demonstration parameters, not NASA or clinical limits. */
export const PARAMS = {
  rt: { observations: 3, minPercent: 10, maxAgeDays: 7 },
  sleep: { windowDays: 7, minDays: 5, minPercentDrop: 15 },
  hr: { windowDays: 5, minDays: 3, minPercent: 10 },
  co2: { maxAgeDays: 2 },
  radiation: { maxAgeDays: 3 },
};

const sources = (ms: Measurement[]): SourceType[] => [...new Set(ms.map((m) => m.source))];
const dir = (abs: number): 'higher' | 'lower' | 'same' => (abs > 0 ? 'higher' : abs < 0 ? 'lower' : 'same');
const lastN = <T,>(xs: T[], n: number) => xs.slice(Math.max(0, xs.length - n));

function sleepStats(input: EvalInput) {
  const base = input.baselines.sleep;
  const daily = toDaily('sleep', input.obs.sleep ?? []).filter((d) => d.day > input.asOfDay - PARAMS.sleep.windowDays);
  if (!base || daily.length < PARAMS.sleep.minDays) return null;
  const avg = mean(daily.map((d) => d.value))!;
  return { avg, base: base.value, pct: pctChange(avg, base.value), n: daily.length };
}

function hrStats(input: EvalInput) {
  const base = input.baselines.hr;
  const daily = toDaily('hr', input.obs.hr ?? []).filter((d) => d.day > input.asOfDay - PARAMS.hr.windowDays);
  if (!base || daily.length < PARAMS.hr.minDays) return null;
  const avg = mean(daily.map((d) => d.value))!;
  return { avg, base: base.value, pct: pctChange(avg, base.value), n: daily.length, daily };
}

function co2Exceeded(input: EvalInput): { value: number; day: number } | null {
  const last = (input.obs.co2 ?? []).at(-1);
  if (!last || input.asOfDay - dayOf(last.t) > PARAMS.co2.maxAgeDays) return null;
  return last.value > CO2_LIMIT_MMHG ? { value: last.value, day: dayOf(last.t) } : null;
}

function evalRt(input: EvalInput): RuleOutcome {
  const base = input.baselines.rt;
  const obs = input.obs.rt ?? [];
  const P = PARAMS.rt;
  if (!base) return { status: 'insufficient', note: 'No personal baseline for reaction time.' };
  if (obs.length < P.observations) return { status: 'insufficient', note: `Needs ${P.observations} assessments; ${obs.length} recorded.` };
  const last = obs[obs.length - 1];
  if (input.asOfDay - dayOf(last.t) > P.maxAgeDays) return { status: 'insufficient', note: `Latest assessment is more than ${P.maxAgeDays} days old.` };
  const recent = lastN(obs, P.observations);
  const pcts = recent.map((m) => pctChange(m.value, base.value));
  const persistent = pcts.every((p) => p !== null && p >= P.minPercent);
  const curPct = pcts[pcts.length - 1];
  if (!persistent) {
    const note = curPct !== null && curPct >= P.minPercent
      ? 'Latest assessment is slower than baseline, but it is a single observation.'
      : 'Within the prototype comparison of the personal baseline.';
    return { status: 'nominal', note };
  }

  const absolute = last.value - base.value;
  const sleep = sleepStats(input);
  const hr = hrStats(input);
  const context: string[] = [];
  if (sleep && sleep.pct !== null && sleep.pct <= -PARAMS.sleep.minPercentDrop)
    context.push(`Mean sleep over the last ${sleep.n} days was ${fmt(sleep.avg, 1)} h against a ${fmt(sleep.base, 1)} h baseline (${signed(sleep.pct, 1)}%).`);
  if (hr && hr.pct !== null && hr.pct >= PARAMS.hr.minPercent)
    context.push(`Resting heart rate averaged ${fmt(hr.avg, 0)} bpm over the last ${hr.n} days against a ${fmt(hr.base, 0)} bpm baseline (${signed(hr.pct, 1)}%).`);
  const co2 = co2Exceeded(input);
  if (co2) context.push(`Cabin CO₂ one-hour average of ${fmt(co2.value, 1)} mmHg exceeded the 3 mmHg reference on Day ${co2.day}.`);
  if (!context.length) context.push('No other documented context in the data for this period.');
  const sleepAssoc = context.some((c) => c.startsWith('Mean sleep'));

  const refDisplay = `${fmt(base.value, 0)} ms median latency`;
  const f: HealthFinding = {
    id: `${input.astronautId}:rt_slowing`,
    astronautId: input.astronautId,
    ruleId: 'rt_slowing', ruleVersion: RULE_VERSION, ruleOrigin: 'prototype',
    indicators: ['rt', ...(sleepAssoc ? (['sleep'] as IndicatorId[]) : [])],
    status: 'review', priority: 20,
    title: 'Slower reaction-time responses observed',
    current: { label: 'Latest median latency', value: last.value, unit: 'ms', display: `${fmt(last.value, 0)} ms` },
    reference: { kind: 'personal_baseline', value: base.value, unit: 'ms', display: refDisplay, sampleCount: base.sampleCount },
    change: { absolute, percent: pcts[pcts.length - 1], direction: dir(absolute) },
    window: { description: `last ${P.observations} assessments`, observations: recent.length, fromDay: dayOf(recent[0].t), toDay: dayOf(last.t) },
    persistence: `${recent.length} of ${recent.length} most recent assessments were at least ${P.minPercent}% slower than baseline.`,
    context,
    evidenceIds: ['nasa_standard_measures', 'nasa_pvt_task', 'nasa_sleep_risk'],
    explanation: explainChange({
      metric: 'median reaction-time latency', current: last.value, baseline: base.value, unit: 'ms', percent: pcts[pcts.length - 1]!,
      windowText: `the last ${recent.length} recorded assessments`, higherMeans: 'slower responses',
    }) + (sleepAssoc ? ' Reduced sleep was also recorded over the same period; NASA studies sleep and fatigue as factors relevant to cognitive performance, but this pattern does not identify a cause.' : ' This pattern does not identify a cause.'),
    whyFlagged: `Prototype rule ${RULE_VERSION}/rt_slowing: the last ${P.observations} assessments were each at least ${P.minPercent}% above the personal baseline (${fmt(base.value, 0)} ms, ${base.sampleCount} simulated preflight sessions).`,
    whyItMatters: 'NASA monitors cognitive performance and sleep longitudinally, and uses reaction-time tests as an objective fatigue-related measure. A sustained shift from a personal baseline is a reason to look again, not a diagnosis.',
    uncertainty: [
      `Baseline comes from ${base.sampleCount} simulated preflight sessions.`,
      `${recent.length} recent assessments were used; browser timing and testing conditions vary.`,
      'The 10% threshold is a prototype choice. NASA does not provide a cutoff for this test.',
      'Association with other signals is not causation.',
    ],
    nextCheck: 'Repeat the standardized reaction-time assessment under comparable conditions and review recent sleep information.',
    action: 'reassess',
    generatedAt: dayEnd(input.asOfDay),
    dataSources: sources(recent),
    spokenText: SPOKEN.rt,
  };
  return { status: 'review', note: 'Persistent slowing versus personal baseline.', finding: f };
}

function evalSleep(input: EvalInput): RuleOutcome {
  const base = input.baselines.sleep;
  if (!base) return { status: 'insufficient', note: 'No personal baseline for sleep.' };
  const s = sleepStats(input);
  if (!s) return { status: 'insufficient', note: `Needs ${PARAMS.sleep.minDays} nights of data in the last ${PARAMS.sleep.windowDays} days.` };
  if (s.pct === null || s.pct > -PARAMS.sleep.minPercentDrop) return { status: 'nominal', note: 'Seven-day mean is within the prototype comparison.' };
  const absolute = s.avg - s.base;
  return {
    status: 'review', note: 'Shorter than baseline over the last week.',
    finding: {
      id: `${input.astronautId}:sleep_reduced`, astronautId: input.astronautId, ruleId: 'sleep_reduced', ruleVersion: RULE_VERSION, ruleOrigin: 'prototype',
      indicators: ['sleep'], status: 'review', priority: 30,
      title: 'Sleep duration is below personal baseline',
      current: { label: `${PARAMS.sleep.windowDays}-day mean sleep`, value: s.avg, unit: 'h', display: `${fmt(s.avg, 1)} h` },
      reference: { kind: 'personal_baseline', value: s.base, unit: 'h', display: `${fmt(s.base, 1)} h`, sampleCount: base.sampleCount },
      change: { absolute, percent: s.pct, direction: dir(absolute) },
      window: { description: `last ${PARAMS.sleep.windowDays} days`, observations: s.n, fromDay: input.asOfDay - PARAMS.sleep.windowDays + 1, toDay: input.asOfDay },
      persistence: `${s.n} nights with data in the window.`,
      context: ['Sleep duration alone does not describe sleep quality, timing or need.'],
      evidenceIds: ['nasa_standard_measures', 'nasa_sleep_risk'],
      explanation: explainChange({ metric: 'mean sleep duration', current: s.avg, baseline: s.base, unit: 'h', percent: s.pct, windowText: `the last ${s.n} recorded nights`, higherMeans: 'longer sleep', decimals: 1 }),
      whyFlagged: `Prototype rule ${RULE_VERSION}/sleep_reduced: the mean of the last ${PARAMS.sleep.windowDays} days (at least ${PARAMS.sleep.minDays} nights recorded) was at least ${PARAMS.sleep.minPercentDrop}% below baseline.`,
      whyItMatters: 'NASA treats sleep loss as a spaceflight risk to performance and health. Sleep is one of the Standard Measures categories.',
      uncertainty: [`Baseline from ${base.sampleCount} simulated preflight sessions.`, 'The 15% threshold is a prototype choice, not a NASA limit.', 'Wearable sleep estimates are simulated here.'],
      nextCheck: 'Review sleep schedule and workload, and consider a reaction-time reassessment.',
      action: 'reassess', generatedAt: dayEnd(input.asOfDay),
      dataSources: sources((input.obs.sleep ?? []).filter((m) => dayOf(m.t) > input.asOfDay - PARAMS.sleep.windowDays)),
      spokenText: SPOKEN.sleep,
    },
  };
}

function evalHr(input: EvalInput): RuleOutcome {
  const base = input.baselines.hr;
  if (!base) return { status: 'insufficient', note: 'No personal baseline for heart rate.' };
  const s = hrStats(input);
  if (!s) return { status: 'insufficient', note: `Needs ${PARAMS.hr.minDays} days of data in the last ${PARAMS.hr.windowDays} days.` };
  if (s.pct === null || s.pct < PARAMS.hr.minPercent) return { status: 'nominal', note: 'Five-day mean is within the prototype comparison.' };
  const absolute = s.avg - s.base;
  return {
    status: 'review', note: 'Above baseline over the last five days.',
    finding: {
      id: `${input.astronautId}:hr_elevated`, astronautId: input.astronautId, ruleId: 'hr_elevated', ruleVersion: RULE_VERSION, ruleOrigin: 'prototype',
      indicators: ['hr'], status: 'review', priority: 40,
      title: 'Resting heart rate above personal baseline',
      current: { label: `${PARAMS.hr.windowDays}-day mean resting heart rate`, value: s.avg, unit: 'bpm', display: `${fmt(s.avg, 0)} bpm` },
      reference: { kind: 'personal_baseline', value: s.base, unit: 'bpm', display: `${fmt(s.base, 0)} bpm`, sampleCount: base.sampleCount },
      change: { absolute, percent: s.pct, direction: dir(absolute) },
      window: { description: `last ${PARAMS.hr.windowDays} days`, observations: s.n, fromDay: input.asOfDay - PARAMS.hr.windowDays + 1, toDay: input.asOfDay },
      persistence: `${s.n} days with data in the window.`,
      context: ['Heart rate is influenced by exercise timing, stress, hydration and fluid shifts; none of these are separated here.'],
      evidenceIds: ['nasa_hrp_hazards'],
      explanation: explainChange({ metric: 'mean resting heart rate', current: s.avg, baseline: s.base, unit: 'bpm', percent: s.pct, windowText: `the last ${s.n} recorded days`, higherMeans: 'a faster resting rate' }),
      whyFlagged: `Prototype rule ${RULE_VERSION}/hr_elevated: the mean of the last ${PARAMS.hr.windowDays} days (at least ${PARAMS.hr.minDays} recorded) was at least ${PARAMS.hr.minPercent}% above baseline.`,
      whyItMatters: 'Cardiovascular adaptation is part of the gravity-fields hazard. A sustained rise from personal baseline is a prompt to recheck, not a diagnosis.',
      uncertainty: [`Baseline from ${base.sampleCount} simulated preflight sessions.`, 'The 10% threshold is a prototype choice, not a NASA or clinical limit.'],
      nextCheck: 'Repeat the resting measurement under comparable conditions and review recent activity and sleep.',
      action: 'review_data', generatedAt: dayEnd(input.asOfDay),
      dataSources: sources(s.daily.length ? (input.obs.hr ?? []).filter((m) => dayOf(m.t) > input.asOfDay - PARAMS.hr.windowDays) : []),
      spokenText: SPOKEN.hr,
    },
  };
}

function evalCo2(input: EvalInput): RuleOutcome {
  const obs = input.obs.co2 ?? [];
  const last = obs.at(-1);
  if (!last) return { status: 'insufficient', note: 'No cabin CO₂ reading.' };
  const age = input.asOfDay - dayOf(last.t);
  if (age > PARAMS.co2.maxAgeDays) return { status: 'insufficient', note: `Latest cabin CO₂ reading is ${age} days old (stale).` };
  if (last.value <= CO2_LIMIT_MMHG) return { status: 'nominal', note: `${fmt(last.value, 1)} mmHg is at or below the ${CO2_LIMIT_MMHG} mmHg one-hour reference.` };
  const diff = last.value - CO2_LIMIT_MMHG;
  return {
    status: 'alert', note: 'One-hour average exceeds the NASA-STD-3001 limit.',
    finding: {
      id: `${input.astronautId}:co2_exceeds_limit`, astronautId: input.astronautId, ruleId: 'co2_exceeds_limit', ruleVersion: RULE_VERSION, ruleOrigin: 'nasa_standard',
      indicators: ['co2'], status: 'alert', priority: 10,
      title: 'Cabin CO₂ one-hour average above NASA limit',
      current: { label: 'Cabin CO₂, one-hour average', value: last.value, unit: 'mmHg', display: `${fmt(last.value, 1)} mmHg` },
      reference: { kind: 'nasa_limit', value: CO2_LIMIT_MMHG, unit: 'mmHg', display: `${CO2_LIMIT_MMHG} mmHg (one-hour average)` },
      change: { absolute: diff, percent: pctChange(last.value, CO2_LIMIT_MMHG), direction: 'higher' },
      window: { description: 'one-hour average on the latest reading', observations: 1, fromDay: dayOf(last.t), toDay: dayOf(last.t) },
      persistence: `Latest reading, Day ${dayOf(last.t)}. A single reading above an explicit environmental limit is flagged without waiting for a trend.`,
      context: [`Exceeds the limit by ${fmt(diff, 1)} mmHg.`, 'This value is cabin-level and applies to all crew in the habitable volume.', 'No medical diagnosis is inferred from CO₂ exposure.'],
      evidenceIds: ['nasa_co2_brief'],
      explanation: `The simulated cabin CO₂ one-hour average is ${fmt(last.value, 1)} mmHg. NASA-STD-3001 requirement V2 6004 limits the one-hour average to ${CO2_LIMIT_MMHG} mmHg, so this reading is ${fmt(diff, 1)} mmHg above it.`,
      whyFlagged: `NASA-derived rule: one-hour average CO₂ partial pressure (${fmt(last.value, 1)} mmHg) is greater than the ${CO2_LIMIT_MMHG} mmHg requirement V2 6004.`,
      whyItMatters: 'The CO₂ limit protects crew in a closed habitat. NASA’s brief reports that symptoms such as headache become more frequent as CO₂ rises, but those reports are observational and individual sensitivity varies.',
      uncertainty: ['The reading is simulated.', 'Fixed sensors can miss local CO₂ pockets.', 'An instantaneous reading would not be equivalent to a one-hour average.', 'Exact requirement text per standard revision was not read from the standard itself.'],
      nextCheck: 'Verify the reading with a second sensor and follow the mission’s environmental-control procedures; notify the crew and flight control as procedures require.',
      action: 'verify_environment', generatedAt: dayEnd(input.asOfDay),
      dataSources: sources([last]), spokenText: SPOKEN.co2,
    },
  };
}

function evalRadiation(input: EvalInput): RuleOutcome {
  const last = (input.obs.radiation ?? []).at(-1);
  if (!last) return { status: 'insufficient', note: 'No dosimetry data.' };
  const age = input.asOfDay - dayOf(last.t);
  if (age > PARAMS.radiation.maxAgeDays) return { status: 'insufficient', note: 'Dosimetry data is stale.' };
  const util = (last.value / CAREER_DOSE_LIMIT_MSV) * 100;
  return { status: 'nominal', note: `Career dose utilization ${fmt(util, 1)}% (${fmt(last.value, 0)} of ${CAREER_DOSE_LIMIT_MSV} mSv). Not an assessment of acute-event safety.` };
}

export interface Evaluation {
  findings: HealthFinding[];
  indicatorStatus: Record<IndicatorId, IndicatorStatus>;
}

export function evaluate(input: EvalInput): Evaluation {
  const results: Partial<Record<IndicatorId, RuleOutcome>> = {
    rt: evalRt(input), sleep: evalSleep(input), hr: evalHr(input), co2: evalCo2(input), radiation: evalRadiation(input),
  };
  const findings = Object.values(results).flatMap((r) => (r?.finding ? [r.finding] : []));
  findings.sort((a, b) => (b.status === 'alert' ? 1 : 0) - (a.status === 'alert' ? 1 : 0) || a.priority - b.priority);
  const indicatorStatus = {} as Record<IndicatorId, IndicatorStatus>;
  for (const id of INDICATOR_ORDER) {
    const r = results[id];
    indicatorStatus[id] = r
      ? { indicator: id, status: r.status, hasRule: true, note: r.note }
      : { indicator: id, status: 'nominal', hasRule: false, note: `Trend only: ${INDICATORS[id].label} has no alert rule in this prototype.` };
  }
  if (findings.some((f) => f.ruleId === 'rt_slowing') && findings.some((f) => f.ruleId === 'sleep_reduced')) {
    indicatorStatus.sleep = { ...indicatorStatus.sleep, status: 'review' };
  }
  return { findings, indicatorStatus };
}
