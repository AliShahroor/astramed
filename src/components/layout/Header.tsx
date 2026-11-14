import { Activity, HeartPulse, RotateCcw, Users, Volume2, VolumeX } from 'lucide-react';
import { ASTRONAUTS, ENVIRONMENTS, SCENARIOS } from '../../data/astronauts';
import { useStore, type Page } from '../../app/store';
import { Tag } from '../shared/ui';
import type { EnvironmentId, ScenarioId } from '../../types';

const NAV: { id: Page; label: string; icon: typeof Users }[] = [
  { id: 'health', label: 'My Health', icon: HeartPulse },
  { id: 'crew', label: 'Crew', icon: Users },
  { id: 'countermeasures', label: 'Countermeasures', icon: Activity },
];

export function Header({ voiceSupported, stopSpeech }: { voiceSupported: boolean; stopSpeech: () => void }) {
  const { state, dispatch } = useStore();
  const set = (patch: Partial<typeof state>) => dispatch({ type: 'set', patch });
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">ASTRAMED</span>
          <Tag tone="warn">Prototype · simulated data</Tag>
        </div>
        <nav aria-label="Primary" className="flex gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id} onClick={() => { set({ page: id }); location.hash = `/${id}`; }}
              aria-current={state.page === id ? 'page' : undefined}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${state.page === id ? 'bg-raised text-fg' : 'text-fg2 hover:bg-raised hover:text-fg'}`}
            >
              <Icon size={16} aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-fg2">Astronaut
            <select className="field" value={state.astronautId} onChange={(e) => set({ astronautId: e.target.value })}>
              {ASTRONAUTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-fg2">Environment
            <select className="field" value={state.envId} onChange={(e) => set({ envId: e.target.value as EnvironmentId })}>
              {Object.values(ENVIRONMENTS).map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-fg2">Demo scenario
            <select className="field" value={state.scenarioId} onChange={(e) => set({ scenarioId: e.target.value as ScenarioId })}>
              {Object.values(SCENARIOS).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <button
            className="btn" aria-pressed={state.voice} disabled={!voiceSupported}
            title={voiceSupported ? 'Spoken notifications use your browser’s speech synthesis' : 'Speech synthesis is not available in this browser'}
            onClick={() => { if (state.voice) stopSpeech(); set({ voice: !state.voice }); }}
          >
            {state.voice ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
            Voice {state.voice ? 'on' : 'off'}
          </button>
          <button className="btn" onClick={() => { if (confirm('Reset the demonstration? Logged readings, assessments, check-ins and activity completions will be cleared.')) { stopSpeech(); dispatch({ type: 'reset' }); } }}>
            <RotateCcw size={16} aria-hidden="true" />Reset demo
          </button>
        </div>
      </div>
    </header>
  );
}
