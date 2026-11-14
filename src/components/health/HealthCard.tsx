import { BookOpen, ClipboardCheck, Square, Volume2 } from 'lucide-react';
import { EVIDENCE_BY_ID } from '../../data/evidence';
import { INDICATORS } from '../../data/indicators';
import { formatMET, signed } from '../../engine/stats';
import type { HealthFinding } from '../../types';
import { StatusBadge, Tag } from '../shared/ui';

const SOURCE_LABEL: Record<string, string> = {
  simulated_wearable: 'Simulated wearable', simulated_environment: 'Simulated environmental sensor', simulated_estimate: 'Simulated estimate',
  manual: 'Manual entry', cognitive_assessment: 'Cognitive assessment',
};

interface Props {
  f: HealthFinding;
  onEvidence: (id: string) => void;
  onReassess: () => void;
  onSpeak: (text: string) => void;
  onStop: () => void;
  speaking: boolean;
  speechSupported: boolean;
}

export function HealthCard({ f, onEvidence, onReassess, onSpeak, onStop, speaking, speechSupported }: Props) {
  const pct = f.change.percent;
  const row = (q: string, body: React.ReactNode) => (
    <div className="grid gap-1 border-t border-line py-3 sm:grid-cols-[170px_1fr] sm:gap-4">
      <h3 className="text-sm font-medium text-fg2">{q}</h3>
      <div className="text-sm">{body}</div>
    </div>
  );
  return (
    <article aria-label={f.title}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={f.status} />
        <Tag tone={f.ruleOrigin === 'nasa_standard' ? 'info' : 'warn'}>{f.ruleOrigin === 'nasa_standard' ? 'NASA-derived rule' : 'Prototype rule (illustrative)'}</Tag>
        <Tag>Simulated data</Tag>
      </div>
      <p className="mb-2 text-base">{f.explanation}</p>
      {row('What changed?', (
        <p><strong>{f.current.display}</strong> {f.current.label.toLowerCase()}
          {pct !== null && <> — {signed(pct, 1)}% versus the reference; absolute difference {signed(f.change.absolute, f.current.unit === 'mmHg' ? 1 : 0)} {f.current.unit}</>}.</p>
      ))}
      {row('Compared with what?', (
        <p>{f.reference.kind === 'personal_baseline' ? 'Personal preflight baseline' : 'NASA reference limit'}: <strong>{f.reference.display}</strong>
          {f.reference.sampleCount && <> (from {f.reference.sampleCount} simulated preflight sessions)</>}.</p>
      ))}
      {row('Over what period?', <p>{f.window.description}, Days {f.window.fromDay}–{f.window.toDay}, {f.window.observations} observation{f.window.observations === 1 ? '' : 's'}. {f.persistence}</p>)}
      {row('Why was this flagged?', <p>{f.whyFlagged}</p>)}
      {row('Other context', <ul className="list-disc space-y-1 pl-5">{f.context.map((c) => <li key={c}>{c}</li>)}</ul>)}
      {row('Why might it matter?', <p>{f.whyItMatters}</p>)}
      {row('Next check', (
        <div className="space-y-2">
          <p>{f.nextCheck}</p>
          {f.action === 'reassess' && <button className="btn btn-primary" onClick={onReassess}><ClipboardCheck size={16} aria-hidden="true" />Run reaction-time reassessment</button>}
        </div>
      ))}
      {row('Source', (
        <ul className="space-y-1">
          {f.evidenceIds.map((id) => (
            <li key={id}>
              <button className="inline-flex items-center gap-2 text-left text-info underline-offset-2 hover:underline" onClick={() => onEvidence(id)}>
                <BookOpen size={14} aria-hidden="true" />{EVIDENCE_BY_ID[id]?.title}
              </button>
            </li>
          ))}
        </ul>
      ))}
      {row('Limits of this reading', <ul className="list-disc space-y-1 pl-5 text-fg2">{f.uncertainty.map((u) => <li key={u}>{u}</li>)}</ul>)}
      {row('Provenance', (
        <p className="text-fg2">Rule {f.ruleVersion}/{f.ruleId} · evaluated {formatMET(f.generatedAt)} · data: {f.dataSources.map((s) => SOURCE_LABEL[s]).join(', ')}. Indicators: {f.indicators.map((i) => INDICATORS[i].label).join(', ')}.</p>
      ))}
      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {speechSupported ? (
          speaking
            ? <button className="btn" onClick={onStop}><Square size={14} aria-hidden="true" />Stop speaking</button>
            : <button className="btn" onClick={() => onSpeak(f.spokenText)}><Volume2 size={16} aria-hidden="true" />Replay spoken notification</button>
        ) : <span className="label">Speech synthesis is not available in this browser.</span>}
        <p className="label">Prototype-derived observation, not a clinical diagnosis. Does not replace a flight surgeon.</p>
      </div>
    </article>
  );
}
