import { useCallback, useEffect, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { EvidenceDialog } from '../components/evidence/EvidenceDialog';
import { HealthCard } from '../components/health/HealthCard';
import { LogReadingDialog } from '../components/health/LogReadingDialog';
import { Dialog } from '../components/shared/ui';
import { useSpeech } from '../hooks/useSpeech';
import { CountermeasuresPage } from '../pages/Countermeasures/CountermeasuresPage';
import { CrewPage } from '../pages/Crew/CrewPage';
import { MyHealthPage } from '../pages/MyHealth/MyHealthPage';
import { useStore, type Page } from './store';

export function App() {
  const { state, dispatch, model } = useStore();
  const speech = useSpeech();
  const set = useCallback((patch: Partial<typeof state>) => dispatch({ type: 'set', patch }), [dispatch]);
  const interacted = useRef(false);
  const spoken = useRef(new Set<string>());

  useEffect(() => {
    const mark = () => { interacted.current = true; };
    window.addEventListener('pointerdown', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    const fromHash = () => {
      const p = location.hash.replace('#/', '') as Page;
      if (p === 'health' || p === 'crew' || p === 'countermeasures') set({ page: p });
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [set]);

  useEffect(() => { if (location.hash !== `#/${state.page}`) history.replaceState(null, '', `#/${state.page}`); }, [state.page]);

  const findings = model.byAstronaut[state.astronautId].evaluation.findings;
  const primary = findings[0];
  const open = findings.find((f) => f.id === state.openFinding);

  // Speak a new top finding once, only after the user has interacted and enabled voice.
  useEffect(() => {
    if (!state.voice || !interacted.current || !primary) return;
    const key = `${primary.id}:${primary.status}`;
    if (spoken.current.has(key)) return;
    spoken.current.add(key);
    speech.speak(primary.spokenText);
  }, [state.voice, primary, speech]);

  return (
    <div className="min-h-full">
      <Header voiceSupported={speech.supported} stopSpeech={speech.stop} />
      <main>
        {state.page === 'health' && <MyHealthPage />}
        {state.page === 'crew' && <CrewPage />}
        {state.page === 'countermeasures' && <CountermeasuresPage />}
      </main>
      <footer className="border-t border-line px-5 py-4 text-center text-[13px] text-fg3">
        ASTRAMED is an unvalidated demonstration prototype by Team Code Blue. All astronaut data are synthetic. It does not diagnose, treat or replace a flight surgeon.
      </footer>
      {open && (
        <Dialog title="Explainable health card" side onClose={() => set({ openFinding: null })}>
          <h2 className="mb-2 text-xl font-semibold">{open.title}</h2>
          <HealthCard
            f={open} speaking={speech.speaking} speechSupported={speech.supported} onSpeak={speech.speak} onStop={speech.stop}
            onEvidence={(id) => set({ openEvidence: id })}
            onReassess={() => set({ openFinding: null, page: 'countermeasures', cmTab: 'cognitive' })}
          />
        </Dialog>
      )}
      {state.openEvidence && <EvidenceDialog id={state.openEvidence} onClose={() => set({ openEvidence: null })} />}
      {state.logOpen && <LogReadingDialog initial={state.indicator} onClose={() => set({ logOpen: false })} />}
    </div>
  );
}
