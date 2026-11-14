import { useState } from 'react';
import { MISSION } from '../../data/astronauts';
import { INDICATORS, INDICATOR_ORDER } from '../../data/indicators';
import { validateReading } from '../../app/model';
import { useStore } from '../../app/store';
import type { IndicatorId } from '../../types';
import { Dialog } from '../shared/ui';

export function LogReadingDialog({ onClose, initial }: { onClose: () => void; initial: IndicatorId }) {
  const { state, dispatch, model } = useStore();
  const loggable = INDICATOR_ORDER.filter((i) => INDICATORS[i].loggable);
  const [ind, setInd] = useState<IndicatorId>(INDICATORS[initial].loggable ? initial : 'hr');
  const def = INDICATORS[ind];
  const [unit, setUnit] = useState(def.unit);
  const [value, setValue] = useState('');
  const [day, setDay] = useState(String(MISSION.currentDay));
  const [time, setTime] = useState('22:00');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setDone('');
    const m = /^(\d{1,2}):(\d{2})$/.exec(time);
    const minute = m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
    const subject = def.subject === 'cabin' ? 'cabin' : state.astronautId;
    const raw = value.trim() === '' ? NaN : Number(value);
    const existing = model.byAstronaut[state.astronautId].measurements;
    const r = validateReading(ind, raw, unit, Number(day), minute, subject, existing);
    if (!r.ok) { setError(r.error); return; }
    setError('');
    dispatch({ type: 'addManual', measurement: { ...r.measurement, id: `manual-${Date.now()}`, source: 'manual' } });
    setDone(`Saved ${r.measurement.value} ${def.unit} for ${def.label.toLowerCase()} on Mission Day ${day}. Charts and findings have been recomputed.`);
    setValue('');
  };

  return (
    <Dialog title="Log a reading" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-sm" noValidate>
        <p className="text-fg2">Manual entries are stored in this browser only and are labelled as manual. Device connectivity is a future capability and is not simulated here.</p>
        <label className="block">
          <span className="label">Indicator</span>
          <select className="field mt-1 w-full" value={ind} onChange={(e) => { const n = e.target.value as IndicatorId; setInd(n); setUnit(INDICATORS[n].unit); setError(''); setDone(''); }}>
            {loggable.map((i) => <option key={i} value={i}>{INDICATORS[i].label}</option>)}
          </select>
        </label>
        {def.subject === 'cabin' && <p className="label">Cabin readings apply to the whole habitable volume, not to {state.astronautId}. Enter a one-hour average.</p>}
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">Value</span>
            <input className="field mt-1 w-full" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={!!error} aria-describedby="log-err" />
          </label>
          <label className="block"><span className="label">Unit</span>
            <select className="field mt-1 w-full" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {def.allowedUnits.map((u) => <option key={u}>{u}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">Mission day (1–{MISSION.currentDay})</span>
            <input className="field mt-1 w-full" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} />
          </label>
          <label className="block"><span className="label">Mission clock (HH:MM)</span>
            <input className="field mt-1 w-full" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <div id="log-err" role="alert" className="min-h-[1.25rem] text-bad">{error}</div>
        {done && <p role="status" className="text-ok">{done}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">Save reading</button>
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </div>
      </form>
    </Dialog>
  );
}
