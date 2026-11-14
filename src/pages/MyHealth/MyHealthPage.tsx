import { ChevronRight, PlusCircle } from 'lucide-react';
import { ASTRONAUT_BY_ID, ENVIRONMENTS, MISSION, SCENARIOS } from '../../data/astronauts';
import { HAZARDS, HAZARD_ORDER, INDICATORS, INDICATOR_ORDER } from '../../data/indicators';
import { EVIDENCE_BY_ID } from '../../data/evidence';
import { toDaily } from '../../engine/series';
import { fmt, formatMET, pctChange, signed } from '../../engine/stats';
import { useStore } from '../../app/store';
import { TrendChart } from '../../components/health/TrendChart';
import { Section, StatusBadge, Tag } from '../../components/shared/ui';
import type { HazardId, IndicatorId } from '../../types';

export function MyHealthPage() {
  const { state, dispatch, model, user } = useStore();
  const set = (patch: Partial<typeof state>) => dispatch({ type: 'set', patch });
  const a = ASTRONAUT_BY_ID[state.astronautId];
  const am = model.byAstronaut[a.id];
  const env = ENVIRONMENTS[state.envId];
  const findings = am.evaluation.findings;
  const primary = findings[0];
  const others = findings.slice(1);
  const counts = { alert: findings.filter((f) => f.status === 'alert').length, review: findings.filter((f) => f.status === 'review').length };
  const manualCount = user.manual.length + user.assessments.length;
  const live = state.asOfDay === MISSION.currentDay;

  const visible: IndicatorId[] = state.hazard ? HAZARDS[state.hazard].priority : INDICATOR_ORDER;
  const shown = visible.includes(state.indicator) ? state.indicator : visible[0];
  const chartDef = INDICATORS[shown];

  const pickHazard = (h: HazardId | null) => {
    if (!h) { set({ hazard: null }); return; }
    set({ hazard: h, indicator: HAZARDS[h].priority[0] });
  };

  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-16">
      <div className="pt-6">
        <h1 className="h1">{a.name}</h1>
        <p className="mt-1 text-fg2">{a.role} · {MISSION.name}</p>
      </div>

      {/* A. context */}
      <section aria-label="Mission context" className="mt-4 grid gap-x-8 gap-y-2 border-y border-line py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><div className="label">{env.dayLabel}</div><div className="font-medium">Day {state.asOfDay} of {MISSION.totalDays}</div></div>
        <div><div className="label">Environment context</div><div className="font-medium">{env.label}</div><div className="text-fg2">{env.gravity}</div></div>
        <div><div className="label">Communication delay</div><div className="text-fg2">{env.commDelay}</div></div>
        <div>
          <div className="label">Data</div>
          <div className="flex flex-wrap items-center gap-1.5"><Tag tone="warn">Simulated</Tag>{manualCount > 0 && <Tag tone="info">{manualCount} manual / live</Tag>}</div>
          <div className="text-fg2">Latest: {formatMET(Math.max(...am.measurements.map((m) => m.t)))}</div>
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
          <label className="flex flex-1 items-center gap-3 text-fg2" style={{ minWidth: 260 }}>
            View as of Mission Day
            <input type="range" min={1} max={MISSION.totalDays} value={state.asOfDay} onChange={(e) => set({ asOfDay: Number(e.target.value) })} className="flex-1 accent-[#4B9C96]" aria-valuetext={`Day ${state.asOfDay}`} />
            <span className="w-10 text-right text-fg">{state.asOfDay}</span>
          </label>
          {!live && <button className="btn" onClick={() => set({ asOfDay: MISSION.currentDay })}>Return to Day {MISSION.currentDay}</button>}
        </div>
        <p className="sm:col-span-2 lg:col-span-4 label">
          Scenario “{SCENARIOS[state.scenarioId].short}” — {SCENARIOS[state.scenarioId].description} Switching environment changes context only; physiological reference limits are not altered because no verified environment-specific limit is available.
        </p>
      </section>

      {/* B + C */}
      <Section title="Current findings" aside={<span className="text-sm text-fg2">{counts.alert} alert · {counts.review} for review</span>}>
        {primary ? (
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={primary.status} /><Tag tone={primary.ruleOrigin === 'nasa_standard' ? 'info' : 'warn'}>{primary.ruleOrigin === 'nasa_standard' ? 'NASA-derived rule' : 'Prototype rule'}</Tag></div>
            <h3 className="mt-2 text-xl font-semibold">{primary.title}</h3>
            <p className="mt-2 max-w-[78ch] text-fg2">{primary.explanation}</p>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
              <span><span className="label">Observed </span>{primary.current.display}</span>
              <span><span className="label">{primary.reference.kind === 'nasa_limit' ? 'NASA limit ' : 'Baseline '}</span>{primary.reference.display}</span>
              {primary.change.percent !== null && <span><span className="label">Change </span>{signed(primary.change.percent, 1)}%</span>}
            </div>
            <button className="btn btn-primary mt-4" onClick={() => set({ openFinding: primary.id })}>Open health card <ChevronRight size={16} aria-hidden="true" /></button>
          </div>
        ) : (
          <p className="rounded-lg border border-line bg-surface p-5 text-fg2">No active findings on Day {state.asOfDay}. Indicators without enough data are listed below as “Insufficient data”.</p>
        )}
        {others.length > 0 && (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {others.map((f) => (
              <li key={f.id}>
                <button className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-raised/60" onClick={() => set({ openFinding: f.id })}>
                  <span className="flex items-center gap-3"><StatusBadge status={f.status} /><span>{f.title}</span></span>
                  <span className="text-sm text-fg2">{f.current.display} vs {f.reference.display}<ChevronRight size={14} className="ml-2 inline" aria-hidden="true" /></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* D */}
      <div className="rule" />
      <Section title="Trends" aside={
        <button className="btn" disabled={!live} title={live ? undefined : `Return to Day ${MISSION.currentDay} to log new readings`} onClick={() => set({ logOpen: true })}><PlusCircle size={16} aria-hidden="true" />Log reading</button>
      }>
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="NASA hazard filter">
          <button className={`btn ${state.hazard === null ? 'btn-primary' : ''}`} aria-pressed={state.hazard === null} onClick={() => pickHazard(null)}>All indicators</button>
          {HAZARD_ORDER.map((h) => (
            <button key={h} className={`btn ${state.hazard === h ? 'btn-primary' : ''}`} aria-pressed={state.hazard === h} onClick={() => pickHazard(h)}>{HAZARDS[h].label}</button>
          ))}
        </div>
        {state.hazard && (
          <p className="mb-4 max-w-[90ch] text-sm text-fg2">
            {HAZARDS[state.hazard].blurb}{' '}
            <button className="text-info underline-offset-2 hover:underline" onClick={() => set({ openEvidence: HAZARDS[state.hazard!].evidenceId })}>Source: {EVIDENCE_BY_ID[HAZARDS[state.hazard].evidenceId].title}</button>.
            {' '}Hazard filters organise indicators; they do not establish diagnoses. The indicator mapping is a prototype choice.
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
          <ul className="divide-y divide-line border-y border-line" aria-label="Indicators">
            {visible.map((id) => {
              const d = INDICATORS[id];
              const st = am.evaluation.indicatorStatus[id];
              const daily = toDaily(id, am.measurements);
              const lastD = daily.at(-1);
              const base = a.baselines[id];
              const pct = lastD && base ? pctChange(lastD.value, base.value) : null;
              return (
                <li key={id}>
                  <button className={`w-full px-2 py-3 text-left transition-colors duration-150 hover:bg-raised/60 ${shown === id ? 'bg-raised' : ''}`} aria-pressed={shown === id} onClick={() => set({ indicator: id })}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{d.label}</span>
                      <span className="text-sm">{lastD ? `${fmt(lastD.value, d.decimals)} ${d.unit}` : '—'}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[13px] text-fg2">
                      <span>{pct !== null ? `${signed(pct, 1)}% vs baseline` : d.id === 'co2' ? 'vs NASA 3 mmHg limit' : 'no personal baseline'}</span>
                      {st.hasRule ? <StatusBadge status={st.status} /> : <span className="text-fg3">Trend only</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div>
            <h3 className="font-medium">{chartDef.label}</h3>
            <p className="mb-2 text-sm text-fg2">{chartDef.description}</p>
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Time range">
              {([['7', '7 days'], ['14', '14 days'], ['30', '30 days'], ['all', 'Full mission']] as const).map(([v, l]) => (
                <button key={v} className={`btn ${state.range === v ? 'btn-primary' : ''}`} aria-pressed={state.range === v} onClick={() => set({ range: v })}>{l}</button>
              ))}
            </div>
            <TrendChart indicator={shown} measurements={am.measurements} baseline={a.baselines[shown]} asOfDay={state.asOfDay} range={state.range} />
            <p className="mt-2 text-sm text-fg2">{am.evaluation.indicatorStatus[shown].note}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
