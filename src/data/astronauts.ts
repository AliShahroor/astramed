import type { Astronaut, EnvironmentId, ScenarioId } from '../types';

export const MISSION = {
  name: 'Meridian-1 (fictional Mars transit)',
  currentDay: 94,
  totalDays: 94,
  baselineLabel: 'Simulated preflight baseline',
};

const base = (hr: number, sleep: number, rt: number, spo2: number, sys: number, dia: number, act: number) => ({
  hr: { value: hr, unit: 'bpm', sampleCount: 14, simulated: true as const },
  sleep: { value: sleep, unit: 'h', sampleCount: 14, simulated: true as const },
  rt: { value: rt, unit: 'ms', sampleCount: 10, simulated: true as const },
  spo2: { value: spo2, unit: '%', sampleCount: 14, simulated: true as const },
  bp_sys: { value: sys, unit: 'mmHg', sampleCount: 14, simulated: true as const },
  bp_dia: { value: dia, unit: 'mmHg', sampleCount: 14, simulated: true as const },
  activity: { value: act, unit: 'min', sampleCount: 14, simulated: true as const },
});

export const ASTRONAUTS: Astronaut[] = [
  {
    id: 'alex', name: 'Alex Moreno', role: 'Flight Engineer', seed: 1101, seedLastCheckIn: 94 * 1440 - 14 * 60,
    history: 'Synthetic profile. Baseline from 14 simulated preflight sessions; moderate habitual exercise.',
    baselines: base(61, 7.4, 285, 97.4, 118, 76, 62),
  },
  {
    id: 'sana', name: 'Sana Idris', role: 'Commander', seed: 2202, seedLastCheckIn: 94 * 1440 - 9 * 60,
    history: 'Synthetic profile. Stable baseline; short sleeper by habit.',
    baselines: base(58, 6.9, 271, 97.8, 114, 72, 70),
  },
  {
    id: 'jonas', name: 'Jonas Lindqvist', role: 'Medical Officer', seed: 3303, seedLastCheckIn: 94 * 1440 - 20 * 60,
    history: 'Synthetic profile. Endurance-trained; low resting heart rate at baseline.',
    baselines: base(52, 7.6, 296, 98.1, 110, 68, 80),
  },
  {
    id: 'mei', name: 'Mei-Lin Chou', role: 'Science Officer', seed: 4404, seedLastCheckIn: 94 * 1440 - 6 * 60,
    history: 'Synthetic profile. Stable baseline across all simulated preflight sessions.',
    baselines: base(64, 7.2, 279, 97.2, 120, 78, 55),
  },
];

export const ASTRONAUT_BY_ID: Record<string, Astronaut> = Object.fromEntries(ASTRONAUTS.map((a) => [a.id, a]));

export interface Effect {
  sleep?: { start: number; end: number; delta: number };
  rt?: { start: number; end: number; delta: number };
  hr?: { start: number; end: number; delta: number };
  /** exact values pinned on a given day so the demonstration numbers are reproducible */
  anchors?: Record<number, Partial<Record<'hr' | 'sleep' | 'rt', number>>>;
}

export interface ScenarioDef {
  id: ScenarioId;
  label: string;
  short: string;
  description: string;
  effects: Record<string, Effect>;
  /** cabin CO₂ one-hour averages pinned on specific days (mmHg, simulated) */
  co2Anchors: Record<number, number>;
}

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  nominal: {
    id: 'nominal', label: 'A — Nominal', short: 'Nominal',
    description: 'All simulated measurements stay close to personal baselines and below cited reference limits.',
    effects: {}, co2Anchors: {},
  },
  fatigue: {
    id: 'fatigue', label: 'B — Fatigue-related observation', short: 'Fatigue observation',
    description: 'Alex’s sleep shortens from about Mission Day 50 and reaction-time latency rises from about Day 66. Jonas shows a mild heart-rate rise.',
    effects: {
      alex: {
        sleep: { start: 50, end: 90, delta: -1.7 },
        rt: { start: 66, end: 94, delta: 66 },
        hr: { start: 60, end: 94, delta: 11 },
        anchors: { 94: { hr: 72, sleep: 5.7, rt: 351 } },
      },
      jonas: { hr: { start: 70, end: 94, delta: 7 } },
    },
    co2Anchors: {},
  },
  environment: {
    id: 'environment', label: 'C — Environmental concern', short: 'Environmental concern',
    description: 'Simulated cabin CO₂ one-hour average rises on the last three days and exceeds the cited 3 mmHg limit on Day 94.',
    effects: {},
    co2Anchors: { 92: 2.8, 93: 3.4, 94: 4.1 },
  },
};

export interface EnvironmentDef {
  id: EnvironmentId;
  label: string;
  gravity: string;
  commDelay: string;
  dayLabel: string;
  radiationContext: string;
  priorities: string;
  exerciseNote: string;
}

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentDef> = {
  mars: {
    id: 'mars', label: 'Mars Transit', gravity: 'Microgravity during transit',
    commDelay: 'About 3 to 22 minutes one way, depending on Earth–Mars geometry',
    dayLabel: 'Mission Day', radiationContext: 'Deep-space transit beyond low Earth orbit',
    priorities: 'Self-reliant monitoring; cognitive performance, sleep, cabin air, cumulative dose.',
    exerciseNote: 'Exercise hardware is limited to what the spacecraft carries.',
  },
  orbital: {
    id: 'orbital', label: 'Orbital Station', gravity: 'Microgravity (continuous free-fall)',
    commDelay: 'Around a second or less via relay satellites',
    dayLabel: 'Mission Day', radiationContext: 'Low Earth orbit, partly shielded by Earth’s magnetosphere',
    priorities: 'Routine crew monitoring with frequent ground contact; cabin air and exercise compliance.',
    exerciseNote: 'ISS exercise hardware includes ARED, T2 treadmill and cycle ergometer (NASA).',
  },
  moon: {
    id: 'moon', label: 'Lunar Surface', gravity: 'About one-sixth of Earth gravity',
    commDelay: 'About 1.3 seconds one way',
    dayLabel: 'Mission Day', radiationContext: 'Surface exposure, no magnetosphere or atmosphere',
    priorities: 'Musculoskeletal loading, dust and cabin air, sleep scheduling.',
    exerciseNote: 'Reduced but non-zero gravity changes how loading exercise is performed.',
  },
  earth: {
    id: 'earth', label: 'Earth Reference', gravity: '1 g (Earth gravity)',
    commDelay: 'None (ground)',
    dayLabel: 'Simulation Day', radiationContext: 'Background terrestrial exposure',
    priorities: 'Reference condition for comparison with the same simulated data.',
    exerciseNote: 'Standard terrestrial equipment.',
  },
};
