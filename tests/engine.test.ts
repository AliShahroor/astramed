import { describe, expect, it } from 'vitest';
import { buildModel, emptyUserData, validateReading, liveTimestamp } from '../src/app/model';
import { RT_PROTOCOL, classifyResponse, summarizeTrials } from '../src/engine/assessments';
import { median, pctChange } from '../src/engine/stats';
import { convertToCanonical } from '../src/engine/units';
import { getScenarioData } from '../src/engine/scenarioData';
import { EVIDENCE, EVIDENCE_BY_ID } from '../src/data/evidence';
import { ASTRONAUTS } from '../src/data/astronauts';
import type { Assessment, ScenarioId } from '../src/types';

const m = (scenarioId: ScenarioId, asOfDay = 94, user = emptyUserData()) => buildModel({ scenarioId, asOfDay, user });

describe('stats', () => {
  it('computes percentage change and guards zero/missing baselines', () => {
    expect(pctChange(351, 285)).toBeCloseTo(23.16, 2);
    expect(pctChange(5, 0)).toBeNull();
    expect(pctChange(NaN, 3)).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  it('converts units and rejects mismatches', () => {
    expect(convertToCanonical('sleep', 330, 'min')).toEqual({ ok: true, value: 5.5 });
    expect(convertToCanonical('rt', 0.3, 's')).toEqual({ ok: true, value: 300 });
    expect(convertToCanonical('hr', 70, 'mmHg').ok).toBe(false);
  });
});

describe('scenario data', () => {
  it('is deterministic', () => {
    expect(getScenarioData('fatigue').byAstronaut.alex).toEqual(getScenarioData('fatigue').byAstronaut.alex);
  });
  it('pins the documented demonstration values for Alex on day 94', () => {
    const alex = getScenarioData('fatigue').byAstronaut.alex.filter((x) => x.t >= 93 * 1440);
    const v = (i: string) => alex.find((x) => x.indicator === i)!.value;
    expect([v('hr'), v('sleep'), v('rt')]).toEqual([72, 5.7, 351]);
  });
});

describe('findings', () => {
  it('Scenario B yields the reaction-time finding with computed change', () => {
    const f = m('fatigue').byAstronaut.alex.evaluation.findings.find((x) => x.ruleId === 'rt_slowing')!;
    expect(f.status).toBe('review');
    expect(f.current.value).toBe(351);
    expect(f.reference.value).toBe(285);
    expect(f.change.percent).toBeCloseTo(23.16, 1);
    expect(f.context.join(' ')).toMatch(/sleep/i);
    expect(f.explanation).toMatch(/23\.2%/);
    expect(f.ruleOrigin).toBe('prototype');
  });
  it('Scenario A produces no findings for anyone on any day', () => {
    for (let d = 1; d <= 94; d++) {
      const model = m('nominal', d);
      for (const a of ASTRONAUTS) expect(model.byAstronaut[a.id].evaluation.findings, `${a.id} day ${d}`).toHaveLength(0);
    }
  });
  it('Scenario C raises a NASA-derived CO2 alert with a 1.1 mmHg exceedance', () => {
    const f = m('environment').byAstronaut.alex.evaluation.findings[0];
    expect(f.ruleId).toBe('co2_exceeds_limit');
    expect(f.status).toBe('alert');
    expect(f.ruleOrigin).toBe('nasa_standard');
    expect(f.change.absolute).toBeCloseTo(1.1, 5);
  });
  it('reports insufficient data early in the mission', () => {
    const ev = m('fatigue', 2).byAstronaut.alex.evaluation;
    expect(ev.indicatorStatus.rt.status).toBe('insufficient');
    expect(ev.indicatorStatus.sleep.status).toBe('insufficient');
  });
  it('radiation is tracked as career utilization, never as an alert', () => {
    const ev = m('fatigue').byAstronaut.alex.evaluation;
    expect(ev.indicatorStatus.radiation.status).toBe('nominal');
    expect(ev.indicatorStatus.radiation.note).toMatch(/utilization/i);
    expect(ev.indicatorStatus.radiation.note).toMatch(/acute/i);
  });
  it('every finding cites existing evidence records', () => {
    for (const s of ['fatigue', 'environment'] as ScenarioId[])
      for (const a of ASTRONAUTS) for (const f of m(s).byAstronaut[a.id].evaluation.findings)
        for (const id of f.evidenceIds) expect(EVIDENCE_BY_ID[id], id).toBeDefined();
    expect(EVIDENCE.filter((e) => e.limit !== undefined).every((e) => e.verified)).toBe(true);
  });
});

describe('feedback loops', () => {
  it('a manual CO2 reading above the limit creates an alert in the nominal scenario', () => {
    const r = validateReading('co2', 4.4, 'mmHg', 94, 16 * 60, 'cabin', []);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const user = { ...emptyUserData(), manual: [{ ...r.measurement, id: 'x', source: 'manual' as const }] };
    expect(m('nominal', 94, user).byAstronaut.alex.evaluation.findings[0]?.ruleId).toBe('co2_exceeds_limit');
  });
  it('a fast live assessment resolves the reaction-time finding; a slow one keeps it', () => {
    const mk = (ms: number): Assessment => ({
      id: 'a1', astronautId: 'alex', t: liveTimestamp(0), protocol: RT_PROTOCOL.version, medianMs: ms, meanMs: ms, validCount: 6, invalidCount: 0,
      falseStarts: 0, anticipatory: 0, timeouts: 0, trials: [], percentVsBaseline: null,
    });
    const has = (ms: number) => m('fatigue', 94, { ...emptyUserData(), assessments: [mk(ms)] }).byAstronaut.alex.evaluation.findings.some((f) => f.ruleId === 'rt_slowing');
    expect(has(280)).toBe(false);
    expect(has(360)).toBe(true);
  });
  it('rejects invalid readings', () => {
    expect(validateReading('hr', NaN, 'bpm', 94, 0, 'alex', []).ok).toBe(false);
    expect(validateReading('hr', 400, 'bpm', 94, 0, 'alex', []).ok).toBe(false);
    expect(validateReading('hr', 70, 'bpm', 200, 0, 'alex', []).ok).toBe(false);
    expect(validateReading('hr', 70, 'bpm', 94, 2000, 'alex', []).ok).toBe(false);
    expect(validateReading('radiation', 70, 'mSv', 94, 0, 'alex', []).ok).toBe(false);
    expect(validateReading('sleep', 400, 'min', 94, 0, 'alex', []).ok).toBe(true);
  });
  it('rejects duplicates', () => {
    const r = validateReading('hr', 70, 'bpm', 94, 60, 'alex', []);
    if (!r.ok) throw new Error('x');
    expect(validateReading('hr', 70, 'bpm', 94, 60, 'alex', [{ ...r.measurement, id: 'd', source: 'manual' }]).ok).toBe(false);
  });
});

describe('notifications and crew', () => {
  it('notifies the crew only for Alex in scenario B (policy: two or more review findings)', () => {
    const n = m('fatigue').notifications;
    expect(n.map((x) => x.id)).toEqual(['alex:attention']);
    expect(n[0].text).not.toMatch(/\d/);
  });
  it('raises one cabin notification in scenario C', () => {
    const n = m('environment').notifications;
    expect(n).toHaveLength(1);
    expect(n[0].kind).toBe('environment');
  });
  it('nominal has no notifications', () => expect(m('nominal').notifications).toHaveLength(0));
});

describe('reaction-time assessment', () => {
  it('classifies responses', () => {
    expect(classifyResponse(250).kind).toBe('valid');
    expect(classifyResponse(60).kind).toBe('anticipatory');
    expect(classifyResponse(2500).kind).toBe('timeout');
  });
  it('summarizes with median and separate invalid counts, and refuses too few valid trials', () => {
    const trials = [{ kind: 'valid' as const, latencyMs: 300 }, { kind: 'valid' as const, latencyMs: 320 }, { kind: 'valid' as const, latencyMs: 340 },
      { kind: 'valid' as const, latencyMs: 500 }, { kind: 'false_start' as const }, { kind: 'timeout' as const, latencyMs: 2500 }];
    const r = summarizeTrials(trials, { value: 285, unit: 'ms', sampleCount: 10, simulated: true });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.assessment.medianMs).toBe(330);
      expect(r.assessment.invalidCount).toBe(2);
      expect(r.assessment.falseStarts).toBe(1);
      expect(r.assessment.percentVsBaseline).toBeCloseTo(15.79, 1);
    }
    expect(summarizeTrials(trials.slice(0, 3)).ok).toBe(false);
  });
});
