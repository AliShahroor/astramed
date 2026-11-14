import { Check, ShieldCheck } from 'lucide-react';
import { ASTRONAUTS, ENVIRONMENTS, MISSION } from '../../data/astronauts';
import { NOTIFY_POLICY_VERSION } from '../../engine/notifications';
import { formatMET } from '../../engine/stats';
import { useStore } from '../../app/store';
import { Section, Tag } from '../../components/shared/ui';
import type { CheckInStatus } from '../../types';

const CHECK: { id: CheckInStatus; label: string }[] = [
  { id: 'ok', label: 'I’m okay' }, { id: 'check_in', label: 'I’d like a check-in' }, { id: 'support', label: 'I need support' },
];

export function CrewPage() {
  const { state, dispatch, model, user } = useStore();
  const me = state.astronautId;
  const env = ENVIRONMENTS[state.envId];
  const notes = model.notifications;
  const myNotes = notes.filter((n) => n.astronautId === me);
  const crewNotes = notes.filter((n) => n.astronautId !== me);
  const shareOn = !state.shareOff.includes(me);

  const lastCheckIn = (id: string) => {
    const mine = user.checkins.filter((c) => c.astronautId === id).at(-1);
    return mine ? mine.t : ASTRONAUTS.find((a) => a.id === id)!.seedLastCheckIn;
  };
  const hasCheckInSince = (id: string, t: number) => user.checkins.some((c) => c.astronautId === id && c.t >= t);

  const rows = ASTRONAUTS.map((a) => {
    const n = notes.find((x) => x.astronautId === a.id);
    const hidden = a.id !== me && state.shareOff.includes(a.id);
    const attention = !!n && !hidden;
    const pending = attention && !hasCheckInSince(a.id, 0);
    return { a, n, hidden, attention, pending };
  });

  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-16">
      <div className="pt-6">
        <h1 className="h1">Crew</h1>
        <p className="mt-1 max-w-[80ch] text-fg2">Shared safety awareness, not shared medical records. You are viewing as {ASTRONAUTS.find((a) => a.id === me)!.name}. Crewmates see only a minimal status.</p>
      </div>

      <Section title="Crew status">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-fg3"><tr><th className="py-2 pr-4 font-normal">Crew member</th><th className="py-2 pr-4 font-normal">Safety status</th><th className="py-2 pr-4 font-normal">Last check-in</th><th className="py-2 font-normal">Response</th></tr></thead>
            <tbody className="divide-y divide-line border-y border-line">
              {rows.map(({ a, hidden, attention, pending }) => (
                <tr key={a.id} className={a.id === me ? 'bg-raised/50' : ''}>
                  <td className="py-3 pr-4"><div className="font-medium">{a.name}{a.id === me && <span className="ml-2 text-fg3">(you)</span>}</div><div className="text-fg2">{a.role}</div></td>
                  <td className="py-3 pr-4">{hidden ? <span className="text-fg2">Status not shared</span> : attention ? <Tag tone="warn">Attention notification</Tag> : <span className="text-ok">No attention notification</span>}</td>
                  <td className="py-3 pr-4 text-fg2">{formatMET(lastCheckIn(a.id))}</td>
                  <td className="py-3">{pending ? <Tag tone="warn">Response pending</Tag> : <span className="text-fg3">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="label mt-2">This is a participation-neutral status view, not a ranking. No measurements are shown to crewmates.</p>
      </Section>

      <div className="rule" />
      <Section title="Notifications" aside={<span className="label">Policy {NOTIFY_POLICY_VERSION}</span>}>
        {notes.length === 0 && <p className="text-fg2">No crew notifications. The policy raises a notification only for an alert-level finding, or when one astronaut has two or more findings under review.</p>}
        <ul className="space-y-3">
          {[...myNotes, ...crewNotes].map((n) => {
            const acked = user.acks[n.id];
            const mine = n.astronautId === me;
            return (
              <li key={n.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2"><Tag tone="warn">{n.kind === 'environment' ? 'Cabin environment' : mine ? 'About you' : 'About a crewmate'}</Tag>{acked && <Tag>Acknowledged {formatMET(acked)}</Tag>}</div>
                <p className="mt-2">{n.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!acked && <button className="btn" onClick={() => dispatch({ type: 'ack', id: n.id, label: n.text })}><Check size={14} aria-hidden="true" />Acknowledge</button>}
                  {mine && <button className="btn" onClick={() => dispatch({ type: 'set', patch: { page: 'health', openFinding: model.byAstronaut[me].evaluation.findings[0]?.id ?? null } })}>View my finding</button>}
                  {n.kind === 'environment' && <button className="btn" onClick={() => dispatch({ type: 'set', patch: { page: 'health', hazard: 'hostile', indicator: 'co2' } })}>View cabin CO₂</button>}
                  {mine && n.kind === 'attention' && <button className="btn" onClick={() => dispatch({ type: 'set', patch: { page: 'countermeasures', cmTab: 'cognitive' } })}>Go to reassessment</button>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-5">
          <h3 className="font-medium">Record your check-in</h3>
          <div className="mt-2 flex flex-wrap gap-2">{CHECK.map((c) => <button key={c.id} className="btn" onClick={() => dispatch({ type: 'checkin', astronautId: me, status: c.id })}>{c.label}</button>)}</div>
        </div>
        <label className="mt-5 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={shareOn} onChange={() => dispatch({ type: 'set', patch: { shareOff: shareOn ? [...state.shareOff, me] : state.shareOff.filter((x) => x !== me) } })} className="accent-[#4B9C96]" />
          Share my attention status with the crew (cabin alerts are always shared)
        </label>
        {user.history.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium">History</h3>
            <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
              {[...user.history].reverse().slice(0, 12).map((h) => <li key={h.id} className="flex justify-between gap-4 py-2"><span>{h.text}</span><span className="text-fg3">{formatMET(h.t)}</span></li>)}
            </ul>
          </div>
        )}
      </Section>

      <div className="rule" />
      <Section title="Communication and privacy">
        <div className="grid gap-6 text-sm md:grid-cols-2">
          <div><h3 className="font-medium">Mission communication delay</h3><p className="mt-1 text-fg2">{env.label}: {env.commDelay}. ASTRAMED runs its analysis on the device so crews can interpret their own data without waiting on Earth. Not every mission is far from Earth, and not every mission lacks connectivity.</p></div>
          <div><h3 className="flex items-center gap-2 font-medium"><ShieldCheck size={16} aria-hidden="true" />Prototype access model</h3><p className="mt-1 text-fg2">Role-based visibility here is simulated in the browser using fictional crew data on {MISSION.name}. Real authenticated access control is not implemented. No external notification is ever sent.</p></div>
        </div>
      </Section>
    </div>
  );
}
