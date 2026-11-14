import { useCallback, useEffect, useRef, useState } from 'react';
import { RT_PROTOCOL, classifyResponse, summarizeTrials } from '../../engine/assessments';
import { signed } from '../../engine/stats';
import type { Assessment, Baseline, TrialRecord } from '../../types';

type Phase = 'intro' | 'waiting' | 'stimulus' | 'feedback' | 'done';

interface Props {
  baseline?: Baseline;
  disabled?: boolean;
  onSave: (a: Omit<Assessment, 'id' | 'astronautId' | 't'>) => void;
}

/** Real stimulus-response task timed with performance.now(). */
export function ReactionTest({ baseline, disabled, onSave }: Props) {
  const total = RT_PROTOCOL.practiceTrials + RT_PROTOCOL.scoredTrials;
  const [phase, setPhase] = useState<Phase>('intro');
  const [trialIdx, setTrialIdx] = useState(0);
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);
  const stimAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const phaseRef = useRef<Phase>('intro');
  const idxRef = useRef(0);
  phaseRef.current = phase;
  idxRef.current = trialIdx;

  const clear = () => { if (timer.current) window.clearTimeout(timer.current); };
  useEffect(() => clear, []);

  const scheduleStimulus = useCallback(() => {
    clear();
    setPhase('waiting');
    const wait = RT_PROTOCOL.waitMinMs + Math.random() * (RT_PROTOCOL.waitMaxMs - RT_PROTOCOL.waitMinMs);
    timer.current = window.setTimeout(() => {
      stimAt.current = performance.now();
      setPhase('stimulus');
      timer.current = window.setTimeout(() => finishTrial({ kind: 'timeout', latencyMs: RT_PROTOCOL.timeoutMs + 1 }), RT_PROTOCOL.timeoutMs);
    }, wait);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishTrial = useCallback((rec: TrialRecord) => {
    clear();
    const idx = idxRef.current;
    const practice = idx < RT_PROTOCOL.practiceTrials;
    const text = rec.kind === 'valid' ? `${Math.round(rec.latencyMs!)} ms`
      : rec.kind === 'false_start' ? 'False start: you responded before the stimulus. This trial is invalid.'
      : rec.kind === 'anticipatory' ? 'Too fast to be a response to the stimulus. This trial is invalid.'
      : 'No response in time. This trial is invalid.';
    setFeedback(`${practice ? 'Practice: ' : ''}${text}`);
    if (!practice) setTrials((t) => [...t, rec.latencyMs !== undefined ? { ...rec, latencyMs: Math.round(rec.latencyMs) } : rec]);
    setPhase('feedback');
    timer.current = window.setTimeout(() => {
      if (idx + 1 >= total) setPhase('done');
      else { setTrialIdx(idx + 1); scheduleStimulus(); }
    }, 1100);
  }, [total, scheduleStimulus]);

  const respond = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'waiting') finishTrial({ kind: 'false_start' });
    else if (p === 'stimulus') finishTrial(classifyResponse(performance.now() - stimAt.current));
  }, [finishTrial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (phaseRef.current === 'waiting' || phaseRef.current === 'stimulus')) { e.preventDefault(); respond(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [respond]);

  const start = () => { setTrials([]); setTrialIdx(0); setSaved(false); scheduleStimulus(); };
  const summary = phase === 'done' ? summarizeTrials(trials, baseline) : null;
  const practice = trialIdx < RT_PROTOCOL.practiceTrials;

  return (
    <div className="space-y-4">
      {phase === 'intro' && (
        <div className="space-y-3 text-sm">
          <p className="max-w-[70ch]">A prototype reaction-time task inspired by vigilance testing. It is not the NASA PVT and is not clinically validated. Wait for the panel to turn amber, then press the <kbd className="rounded border border-line px-1">Space</kbd> bar or tap the panel as fast as you can. Responding early is a false start.</p>
          <p className="text-fg2">Protocol {RT_PROTOCOL.version}: {RT_PROTOCOL.practiceTrials} practice trials (not scored), then {RT_PROTOCOL.scoredTrials} scored trials. At least {RT_PROTOCOL.minValidTrials} valid trials are needed to save a result. Test under comparable conditions each time.</p>
          <button className="btn btn-primary" onClick={start} disabled={disabled}>Start with practice</button>
          {disabled && <p className="label">Assessments can be recorded only when viewing the latest mission day.</p>}
        </div>
      )}
      {phase !== 'intro' && phase !== 'done' && (
        <div>
          <p className="mb-2 text-sm text-fg2" aria-live="polite">{practice ? `Practice trial ${trialIdx + 1} of ${RT_PROTOCOL.practiceTrials}` : `Scored trial ${trialIdx - RT_PROTOCOL.practiceTrials + 1} of ${RT_PROTOCOL.scoredTrials}`}</p>
          <button
            onPointerDown={respond} onKeyDown={(e) => { if (e.code === 'Space') e.preventDefault(); }}
            aria-label={phase === 'stimulus' ? 'Respond now' : 'Wait for the stimulus'}
            className={`flex h-56 w-full select-none items-center justify-center rounded-lg border text-lg font-medium transition-none ${phase === 'stimulus' ? 'border-warn bg-warn text-bg' : 'border-line bg-surface text-fg2'}`}
          >
            {phase === 'waiting' && 'Wait…'}
            {phase === 'stimulus' && 'NOW'}
            {phase === 'feedback' && <span className="px-4 text-center text-fg">{feedback}</span>}
          </button>
        </div>
      )}
      {phase === 'done' && summary && (
        <div className="space-y-3 text-sm">
          {summary.ok ? (
            <>
              <h3 className="text-base font-semibold">Result: median {summary.assessment.medianMs} ms</h3>
              <ul className="space-y-1 text-fg2">
                <li>{summary.assessment.validCount} valid trials · {summary.assessment.invalidCount} invalid ({summary.assessment.falseStarts} false starts, {summary.assessment.anticipatory} anticipatory, {summary.assessment.timeouts} timeouts)</li>
                <li>Mean {summary.assessment.meanMs} ms · protocol {summary.assessment.protocol}</li>
                {summary.assessment.percentVsBaseline !== null && baseline && <li>{signed(summary.assessment.percentVsBaseline, 1)}% versus personal baseline of {baseline.value} ms</li>}
              </ul>
              <div className="flex gap-2">
                <button className="btn btn-primary" disabled={saved} onClick={() => { onSave(summary.assessment); setSaved(true); }}>{saved ? 'Saved to history' : 'Save result'}</button>
                <button className="btn" onClick={() => setPhase('intro')}>Run again</button>
              </div>
              {saved && <p role="status" className="text-ok">Saved. My Health and Crew have been updated.</p>}
            </>
          ) : (
            <>
              <p role="alert" className="text-warn">Result not recorded. {summary.reason}</p>
              <button className="btn btn-primary" onClick={() => setPhase('intro')}>Try again</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
