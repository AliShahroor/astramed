export type IndicatorId =
  | 'hr' | 'bp_sys' | 'bp_dia' | 'spo2' | 'sleep' | 'activity' | 'rt' | 'co2' | 'radiation' | 'bone';

export type SourceType =
  | 'simulated_wearable'
  | 'simulated_environment'
  | 'simulated_estimate'
  | 'manual'
  | 'cognitive_assessment';

export type StatusId = 'nominal' | 'review' | 'alert' | 'insufficient';
export type HazardId = 'radiation' | 'gravity' | 'isolation' | 'hostile' | 'distance';
export type ScenarioId = 'nominal' | 'fatigue' | 'environment';
export type EnvironmentId = 'earth' | 'orbital' | 'mars' | 'moon';
export type Aggregate = 'mean' | 'sum' | 'last';
export type ChartType = 'line' | 'bar' | 'area';

/** Time is stored as minutes since mission start (MET). Day 1 starts at t = 0. */
export interface Measurement {
  id: string;
  indicator: IndicatorId;
  /** astronaut id, or 'cabin' for environment-level readings */
  subject: string;
  value: number;
  unit: string;
  t: number;
  source: SourceType;
  note?: string;
}

export interface IndicatorDef {
  id: IndicatorId;
  label: string;
  unit: string;
  decimals: number;
  /** direction in which a change draws attention; 'none' = no direction is assumed */
  attentionDirection: 'higher' | 'lower' | 'both' | 'none';
  plausible: [number, number];
  loggable: boolean;
  allowedUnits: string[];
  aggregate: Aggregate;
  chart: ChartType;
  subject: 'astronaut' | 'cabin';
  hazards: HazardId[];
  description: string;
}

export interface Baseline {
  value: number;
  unit: string;
  sampleCount: number;
  simulated: true;
}

export interface Astronaut {
  id: string;
  name: string;
  role: string;
  history: string;
  baselines: Partial<Record<IndicatorId, Baseline>>;
  seed: number;
  seedLastCheckIn: number;
}

export interface EvidenceRecord {
  id: string;
  agency: 'NASA';
  title: string;
  url: string;
  documentVersion: string;
  section: string;
  evidenceType: 'standard' | 'research_finding' | 'program_resource' | 'measurement_protocol' | 'data_repository';
  indicators: IndicatorId[];
  statement: string;
  unit?: string;
  aggregation?: string;
  limit?: number;
  applicability: string;
  limitations: string[];
  verified: boolean;
  verificationNote: string;
  supports: string;
}

export interface HealthFinding {
  id: string;
  astronautId: string;
  ruleId: string;
  ruleVersion: string;
  ruleOrigin: 'nasa_standard' | 'prototype';
  indicators: IndicatorId[];
  status: StatusId;
  priority: number;
  title: string;
  current: { label: string; value: number; unit: string; display: string };
  reference: { kind: 'personal_baseline' | 'nasa_limit'; value: number; unit: string; display: string; sampleCount?: number };
  change: { absolute: number; percent: number | null; direction: 'higher' | 'lower' | 'same' };
  window: { description: string; observations: number; fromDay: number; toDay: number };
  persistence: string;
  context: string[];
  evidenceIds: string[];
  explanation: string;
  whyFlagged: string;
  whyItMatters: string;
  uncertainty: string[];
  nextCheck: string;
  action: 'reassess' | 'verify_environment' | 'review_data' | 'none';
  generatedAt: number;
  dataSources: SourceType[];
  spokenText: string;
}

export interface IndicatorStatus {
  indicator: IndicatorId;
  status: StatusId;
  hasRule: boolean;
  note: string;
}

export interface TrialRecord {
  kind: 'valid' | 'false_start' | 'anticipatory' | 'timeout';
  latencyMs?: number;
}

export interface Assessment {
  id: string;
  astronautId: string;
  t: number;
  protocol: string;
  medianMs: number;
  meanMs: number;
  validCount: number;
  invalidCount: number;
  falseStarts: number;
  anticipatory: number;
  timeouts: number;
  trials: TrialRecord[];
  baselineMs?: number;
  percentVsBaseline: number | null;
}

export type CheckInStatus = 'ok' | 'check_in' | 'support';
export interface CheckIn { astronautId: string; t: number; status: CheckInStatus }

export interface Completion {
  id: string;
  astronautId: string;
  day: number;
  activityId: string;
  minutes: number;
  kind: 'activity' | 'rest';
}

export interface CrewNotification {
  id: string;
  kind: 'attention' | 'environment';
  astronautId: string;
  text: string;
  findingIds: string[];
  t: number;
}

export interface HistoryEvent { id: string; t: number; text: string }

export interface ScenarioUserData {
  manual: Measurement[];
  assessments: Assessment[];
  acks: Record<string, number>;
  checkins: CheckIn[];
  completions: Completion[];
  history: HistoryEvent[];
  liveCount: number;
}
