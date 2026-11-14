import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { ASTRONAUT_BY_ID, MISSION } from '../data/astronauts';
import type {
  Assessment, CheckInStatus, Completion, EnvironmentId, HazardId, IndicatorId, Measurement, ScenarioId, ScenarioUserData,
} from '../types';
import { buildModel, emptyUserData, liveTimestamp, type Model } from './model';

export type Page = 'health' | 'crew' | 'countermeasures';
export type CmTab = 'physical' | 'cognitive' | 'progress';
export type Range = '7' | '14' | '30' | 'all';

export interface State {
  scenarioId: ScenarioId;
  astronautId: string;
  envId: EnvironmentId;
  asOfDay: number;
  hazard: HazardId | null;
  indicator: IndicatorId;
  range: Range;
  page: Page;
  cmTab: CmTab;
  voice: boolean;
  shareOff: string[];
  userData: Partial<Record<ScenarioId, ScenarioUserData>>;
  // transient (not persisted)
  openFinding: string | null;
  openEvidence: string | null;
  logOpen: boolean;
}

export const initialState: State = {
  scenarioId: 'fatigue', astronautId: 'alex', envId: 'mars', asOfDay: MISSION.currentDay, hazard: null,
  indicator: 'rt', range: '30', page: 'health', cmTab: 'physical', voice: false, shareOff: [], userData: {},
  openFinding: null, openEvidence: null, logOpen: false,
};

export type Action =
  | { type: 'set'; patch: Partial<State> }
  | { type: 'addManual'; measurement: Measurement }
  | { type: 'addAssessment'; assessment: Omit<Assessment, 't'> }
  | { type: 'ack'; id: string; label: string }
  | { type: 'checkin'; astronautId: string; status: CheckInStatus }
  | { type: 'complete'; completion: Omit<Completion, 'id'>; label: string }
  | { type: 'reset' };

const STORAGE_KEY = 'astramed.v1';
const PERSISTED: (keyof State)[] = ['scenarioId', 'astronautId', 'envId', 'asOfDay', 'hazard', 'indicator', 'range', 'page', 'cmTab', 'voice', 'shareOff', 'userData'];

export function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      const s = { ...initialState, ...parsed, openFinding: null, openEvidence: null, logOpen: false };
      if (!ASTRONAUT_BY_ID[s.astronautId]) s.astronautId = 'alex';
      return s;
    }
  } catch { /* storage unavailable: start from defaults */ }
  return initialState;
}

const ud = (s: State): ScenarioUserData => s.userData[s.scenarioId] ?? emptyUserData();
const withUd = (s: State, u: ScenarioUserData): State => ({ ...s, userData: { ...s.userData, [s.scenarioId]: u } });
const ev = (u: ScenarioUserData, t: number, text: string) => ({ ...u, history: [...u.history, { id: `h${u.history.length}-${t}`, t, text }] });

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'set': return { ...s, ...a.patch };
    case 'reset': return { ...initialState };
    case 'addManual': {
      const u = ud(s);
      return withUd(s, ev({ ...u, manual: [...u.manual, a.measurement] }, a.measurement.t, `Reading logged: ${a.measurement.indicator}`));
    }
    case 'addAssessment': {
      const u = ud(s);
      const t = liveTimestamp(u.liveCount);
      const full: Assessment = { ...a.assessment, t };
      return withUd(s, ev({ ...u, assessments: [...u.assessments, full], liveCount: u.liveCount + 1 }, t, `Reaction-time assessment saved: ${full.medianMs} ms median`));
    }
    case 'ack': {
      const u = ud(s);
      const t = liveTimestamp(u.liveCount);
      return withUd(s, ev({ ...u, acks: { ...u.acks, [a.id]: t }, liveCount: u.liveCount + 1 }, t, `Notification acknowledged: ${a.label}`));
    }
    case 'checkin': {
      const u = ud(s);
      const t = liveTimestamp(u.liveCount);
      const labels = { ok: 'okay', check_in: 'wants a check-in', support: 'needs support' };
      return withUd(s, ev({ ...u, checkins: [...u.checkins, { astronautId: a.astronautId, t, status: a.status }], liveCount: u.liveCount + 1 }, t, `Check-in recorded: ${ASTRONAUT_BY_ID[a.astronautId].name} ${labels[a.status]}`));
    }
    case 'complete': {
      const u = ud(s);
      const c: Completion = { ...a.completion, id: `c${u.completions.length}-${a.completion.day}` };
      const t = liveTimestamp(u.liveCount);
      const manual = c.kind === 'activity' && c.minutes > 0
        ? [...u.manual, { id: `act-${c.id}`, indicator: 'activity' as const, subject: c.astronautId, value: c.minutes, unit: 'min', t, source: 'manual' as const }]
        : u.manual;
      return withUd(s, ev({ ...u, completions: [...u.completions, c], manual, liveCount: u.liveCount + 1 }, t, a.label));
    }
  }
}

interface Ctx { state: State; dispatch: Dispatch<Action>; model: Model; user: ScenarioUserData }
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  useEffect(() => {
    try {
      const out: Partial<State> = {};
      for (const k of PERSISTED) (out as Record<string, unknown>)[k] = state[k];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch { /* ignore */ }
  }, [state]);
  const user = ud(state);
  const model = useMemo(() => buildModel({ scenarioId: state.scenarioId, asOfDay: state.asOfDay, user }), [state.scenarioId, state.asOfDay, user]);
  const value = useMemo(() => ({ state, dispatch, model, user }), [state, model, user]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}
