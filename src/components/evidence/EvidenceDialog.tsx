import { ExternalLink } from 'lucide-react';
import { EVIDENCE_BY_ID } from '../../data/evidence';
import { Dialog, Tag } from '../shared/ui';

const TYPE: Record<string, string> = {
  standard: 'NASA standard / technical requirement',
  research_finding: 'NASA research finding (observational)',
  program_resource: 'NASA program resource',
  measurement_protocol: 'NASA measurement protocol',
  data_repository: 'NASA data repository',
};

export function EvidenceDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const e = EVIDENCE_BY_ID[id];
  if (!e) return null;
  return (
    <Dialog title="Evidence record" onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="text-base font-semibold">{e.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Tag tone="info">{TYPE[e.evidenceType]}</Tag>
            <Tag tone={e.verified ? 'muted' : 'warn'}>{e.verified ? 'Verified against NASA page' : 'Not verified'}</Tag>
          </div>
        </div>
        <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2">
          <dt className="label">Agency</dt><dd>{e.agency}</dd>
          <dt className="label">Version</dt><dd>{e.documentVersion}</dd>
          <dt className="label">Section</dt><dd>{e.section}</dd>
          {e.limit !== undefined && (<><dt className="label">Reference value</dt><dd>{e.limit} {e.unit}{e.aggregation ? ` (${e.aggregation.replace(/_/g, ' ')})` : ''}</dd></>)}
          <dt className="label">Applies to</dt><dd>{e.applicability}</dd>
          <dt className="label">Used for</dt><dd>{e.supports}</dd>
        </dl>
        <div>
          <h4 className="label mb-1">What the source says (paraphrase)</h4>
          <p>{e.statement}</p>
        </div>
        <div>
          <h4 className="label mb-1">Limitations</h4>
          <ul className="list-disc space-y-1 pl-5 text-fg2">{e.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
        <p className="label">{e.verificationNote}</p>
        <a className="btn" href={e.url} target="_blank" rel="noreferrer"><ExternalLink size={14} aria-hidden="true" />Open original NASA source</a>
        <p className="label">This summary is packaged with the app and works without a network connection; the link requires one.</p>
      </div>
    </Dialog>
  );
}
