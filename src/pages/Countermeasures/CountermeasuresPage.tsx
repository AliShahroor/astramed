import { CheckCircle2, Moon } from 'lucide-react';
import { ACTIVITIES, SEED_PARTICIPATION } from '../../data/countermeasures';
import { ASTRONAUTS, ASTRONAUT_BY_ID, MISSION } from '../../data/astronauts';
import { EVIDENCE_BY_ID } from '../../data/evidence';
import { formatMET } from '../../engine/stats';
import { useStore, type CmTab } from '../../app/store';
import { ReactionTest } from '../../components/assessments/ReactionTest';
import { Section, Tag } from '../../components/shared/ui';
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

const TABS: { id: CmTab; label: string }[] = [{ id: 'physical', label: 'Physical' }, { id: 'cognitive', label: 'Cognitive' }, { id: 'progress', label: 'Progress' }];

export function CountermeasuresPage() {
  const { state, dispatch, model, user } = useStore();
  const set = (patch: Partial<typeof state>) => dispatch({ type: 'set', patch });
  const a = ASTRONAUT_BY_ID[state.astronautId];
  const today = MISSION.currentDay;
  const live = state.asOfDay === today;
  const mine = user.completions.filter((c) => c.astronautId === a.id);
  const todayDone = (id: string) => mine.some((c) => c.day === today && c.activityId === id);
  const days = new Set<number>([...(SEED_PARTICIPATION[a.id]?.days ?? []), ...mine.map((c) => c.day)]);
  let streak = 0;
  for (let d = days.has(today) ? today : today - 1; days.has(d); d--) streak++;
  const sessions = (SEED_PARTICIPATION[a.id]?.sessions ?? 0) + mine.filter((c) => c.kind === 'activity').length;
  const minutes = mine.filter((c) => c.kind === 'activity').reduce((x, c) => x + c.minutes, 0);

  const rtObs = model.byAstronaut[a.id].measurements.filter((m) => m.indicator === 'rt').map((m) => ({ day: Math.floor(m.t / 1440) + 1, value: m.value, live: m.id.startsWith('live-') }));
  const assessments = user.assessments.filter((x) => x.astronautId === a.id);
  const base = a.baselines.rt;

  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-16">
      <div className="pt-6">
        <h1 className="h1">Countermeasures</h1>
        <p className="mt-1 max-w-[80ch] text-fg2">Health-supporting activities and assessments for {a.name}. Participation is voluntary and never penalised.</p>
      </div>
      <div className="mt-4 flex gap-1 border-b border-line" role="tablist" aria-label="Countermeasure sections">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={state.cmTab === t.id} onClick={() => set({ cmTab: t.id })}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors duration-150 ${state.cmTab === t.id ? 'border-accent text-fg' : 'border-transparent text-fg2 hover:text-fg'}`}>{t.label}</button>
        ))}
      </div>

      {state.cmTab === 'physical' && (
        <Section title="Activity library">
          <p className="mb-4 max-w-[85ch] text-sm text-fg2">
            These are illustrative demonstration routines. They are not NASA-prescribed exercise protocols; real exercise follows mission procedures and flight-surgeon guidance.
            Equipment context names NASA ISS hardware (<button className="text-info hover:underline" onClick={() => set({ openEvidence: 'nasa_exercise_countermeasures' })}>{EVIDENCE_BY_ID.nasa_exercise_countermeasures.title}</button>).
            Completing an activity adds its minutes to today’s physical activity indicator.
          </p>
          <ul className="divide-y divide-line border-y border-line">
            {ACTIVITIES.map((act) => (
              <li key={act.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{act.name}</h3><span className="text-sm text-fg2">{act.minutes} min</span>{act.nasaEquipment ? <Tag tone="info">NASA ISS equipment context</Tag> : <Tag>Illustrative</Tag>}</div>
                  <p className="text-sm text-fg2">{act.purpose}</p>
                  <p className="mt-1 text-sm"><span className="label">Equipment: </span>{act.equipment}</p>
                  <p className="text-sm"><span className="label">Safety: </span>{act.safety}</p>
                </div>
                <div className="flex items-center gap-3">
                  {todayDone(act.id) ? <span className="inline-flex items-center gap-1.5 text-sm text-ok"><CheckCircle2 size={16} aria-hidden="true" />Completed today</span> : <span className="text-sm text-fg3">Not done today</span>}
                  <button className="btn" disabled={!live} onClick={() => dispatch({ type: 'complete', completion: { astronautId: a.id, day: today, activityId: act.id, minutes: act.minutes, kind: 'activity' }, label: `Activity completed: ${act.name}` })}>Mark complete</button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {state.cmTab === 'cognitive' && (
        <Section title="Reaction-time assessment">
          <div className="grid gap-8 lg:grid-cols-[minmax(320px,520px)_1fr]">
            <div><ReactionTest baseline={base} disabled={!live} onSave={(x) => dispatch({ type: 'addAssessment', assessment: { ...x, id: `as-${Date.now()}`, astronautId: a.id } })} /></div>
            <div>
              <h3 className="font-medium">Reaction-time history</h3>
              <div className="mt-2 h-[240px]">
                <ResponsiveContainer>
                  <LineChart data={rtObs} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid stroke="#253239" vertical={false} />
                    <XAxis dataKey="day" type="number" domain={['dataMin', 'dataMax']} tick={{ fill: '#A7B4BC', fontSize: 12 }} stroke="#253239" />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#A7B4BC', fontSize: 12 }} stroke="#253239" width={44} />
                    <Tooltip contentStyle={{ background: '#121B20', border: '1px solid #253239', color: '#E7EDF0', fontSize: 13 }} formatter={(v) => [`${v} ms`, 'Median latency']} labelFormatter={(d) => `Mission day ${Math.round(Number(d))}`} />
                    {base && <ReferenceLine y={base.value} stroke="#83A9D2" strokeDasharray="5 4" label={{ value: `Baseline ${base.value}`, fill: '#83A9D2', fontSize: 12, position: 'insideTopLeft' }} />}
                    <Line dataKey="value" stroke="#4B9C96" strokeWidth={2} isAnimationActive={false} dot={(p: { cx?: number; cy?: number; payload?: { live: boolean; day: number } }) => <circle key={`r-${p.payload?.day}`} cx={p.cx} cy={p.cy} r={p.payload?.live ? 5 : 2.5} fill={p.payload?.live ? '#D8AA58' : '#4B9C96'} />} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="label">Median latency per assessment in ms. Amber points are assessments completed in this app.</p>
              {assessments.length > 0 && (
                <table className="mt-3 w-full text-left text-sm"><thead className="text-fg3"><tr><th className="py-1 font-normal">When</th><th className="font-normal">Median</th><th className="font-normal">Valid / invalid</th><th className="font-normal">vs baseline</th></tr></thead>
                  <tbody className="divide-y divide-line">{[...assessments].reverse().map((x) => <tr key={x.id}><td className="py-1.5">{formatMET(x.t)}</td><td>{x.medianMs} ms</td><td>{x.validCount} / {x.invalidCount}</td><td>{x.percentVsBaseline === null ? '—' : `${x.percentVsBaseline > 0 ? '+' : ''}${x.percentVsBaseline.toFixed(1)}%`}</td></tr>)}</tbody></table>
              )}
              <div className="mt-4"><button className="btn" onClick={() => set({ page: 'health', indicator: 'rt' })}>See trend on My Health</button></div>
            </div>
          </div>
        </Section>
      )}

      {state.cmTab === 'progress' && (
        <Section title="Your participation">
          <div className="flex flex-wrap gap-x-12 gap-y-3 text-sm">
            <div><div className="label">Activity streak</div><div className="text-lg font-semibold">{streak} day{streak === 1 ? '' : 's'}</div>{!days.has(today) && streak > 0 && <div className="label">Complete one today to continue it</div>}</div>
            <div><div className="label">Sessions completed</div><div className="text-lg font-semibold">{sessions}</div></div>
            <div><div className="label">Minutes logged here</div><div className="text-lg font-semibold">{minutes}</div></div>
          </div>
          <div className="mt-4">
            <button className="btn" disabled={!live || days.has(today)} onClick={() => dispatch({ type: 'complete', completion: { astronautId: a.id, day: today, activityId: 'rest', minutes: 0, kind: 'rest' }, label: 'Rest day recorded' })}><Moon size={14} aria-hidden="true" />Record a rest day</button>
            <p className="label mt-1">A rest day keeps your streak. Illness or health limits are never penalised.</p>
          </div>
          <h3 className="mt-8 font-medium">Crew participation (voluntary, synthetic seed + this session)</h3>
          <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
            {[...ASTRONAUTS].sort((x, y) => x.name.localeCompare(y.name)).map((c) => {
              const extra = user.completions.filter((x) => x.astronautId === c.id && x.kind === 'activity').length;
              return <li key={c.id} className="flex justify-between py-2"><span>{c.name}</span><span className="text-fg2">{SEED_PARTICIPATION[c.id].sessions + extra} sessions</span></li>;
            })}
          </ul>
          <p className="label mt-2">Listed alphabetically. Participation counts are not a measure of health, fitness or safety.</p>
        </Section>
      )}
    </div>
  );
}
