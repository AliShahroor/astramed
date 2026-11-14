import type { HazardId, IndicatorDef, IndicatorId } from '../types';

export const INDICATORS: Record<IndicatorId, IndicatorDef> = {
  hr: {
    id: 'hr', label: 'Resting heart rate', unit: 'bpm', decimals: 0, attentionDirection: 'higher',
    plausible: [25, 220], loggable: true, allowedUnits: ['bpm'], aggregate: 'mean', chart: 'line',
    subject: 'astronaut', hazards: ['gravity', 'isolation'],
    description: 'Morning resting heart rate from a simulated wearable.',
  },
  bp_sys: {
    id: 'bp_sys', label: 'Blood pressure, systolic', unit: 'mmHg', decimals: 0, attentionDirection: 'both',
    plausible: [50, 260], loggable: true, allowedUnits: ['mmHg', 'kPa'], aggregate: 'mean', chart: 'line',
    subject: 'astronaut', hazards: ['gravity'],
    description: 'Systolic blood pressure, simulated morning measurement.',
  },
  bp_dia: {
    id: 'bp_dia', label: 'Blood pressure, diastolic', unit: 'mmHg', decimals: 0, attentionDirection: 'both',
    plausible: [30, 160], loggable: true, allowedUnits: ['mmHg', 'kPa'], aggregate: 'mean', chart: 'line',
    subject: 'astronaut', hazards: ['gravity'],
    description: 'Diastolic blood pressure, simulated morning measurement.',
  },
  spo2: {
    id: 'spo2', label: 'Oxygen saturation', unit: '%', decimals: 1, attentionDirection: 'lower',
    plausible: [50, 100], loggable: true, allowedUnits: ['%'], aggregate: 'mean', chart: 'line',
    subject: 'astronaut', hazards: ['hostile'],
    description: 'Peripheral oxygen saturation (SpO₂), simulated.',
  },
  sleep: {
    id: 'sleep', label: 'Sleep duration', unit: 'h', decimals: 1, attentionDirection: 'lower',
    plausible: [0, 24], loggable: true, allowedUnits: ['h', 'min'], aggregate: 'mean', chart: 'bar',
    subject: 'astronaut', hazards: ['isolation'],
    description: 'Nightly sleep duration from a simulated wrist sensor.',
  },
  activity: {
    id: 'activity', label: 'Physical activity', unit: 'min', decimals: 0, attentionDirection: 'none',
    plausible: [0, 600], loggable: true, allowedUnits: ['min', 'h'], aggregate: 'sum', chart: 'bar',
    subject: 'astronaut', hazards: ['gravity', 'isolation'],
    description: 'Active minutes per day. Completed countermeasure sessions add to the day’s total.',
  },
  rt: {
    id: 'rt', label: 'Reaction-time latency', unit: 'ms', decimals: 0, attentionDirection: 'higher',
    plausible: [100, 5000], loggable: true, allowedUnits: ['ms', 's'], aggregate: 'mean', chart: 'line',
    subject: 'astronaut', hazards: ['isolation', 'distance'],
    description: 'Median latency of a prototype reaction-time assessment. Higher means slower responses.',
  },
  co2: {
    id: 'co2', label: 'Cabin CO₂ (1-hour average)', unit: 'mmHg', decimals: 1, attentionDirection: 'higher',
    plausible: [0, 30], loggable: true, allowedUnits: ['mmHg', 'kPa'], aggregate: 'last', chart: 'line',
    subject: 'cabin', hazards: ['hostile'],
    description: 'Habitable-volume CO₂ partial pressure, averaged over one hour. Instantaneous readings are not equivalent.',
  },
  radiation: {
    id: 'radiation', label: 'Cumulative radiation dose', unit: 'mSv', decimals: 1, attentionDirection: 'none',
    plausible: [0, 5000], loggable: false, allowedUnits: ['mSv'], aggregate: 'last', chart: 'area',
    subject: 'astronaut', hazards: ['radiation'],
    description: 'Simulated accumulated effective dose. Dosimeter data cannot be entered manually in this prototype.',
  },
  bone: {
    id: 'bone', label: 'Bone density change (estimate)', unit: '%', decimals: 1, attentionDirection: 'lower',
    plausible: [-30, 10], loggable: false, allowedUnits: ['%'], aggregate: 'last', chart: 'line',
    subject: 'astronaut', hazards: ['gravity'],
    description: 'Simulated estimate of change from preflight. No NASA-verified expected trajectory is shown.',
  },
};

export const INDICATOR_ORDER: IndicatorId[] = [
  'rt', 'sleep', 'hr', 'bp_sys', 'bp_dia', 'spo2', 'activity', 'co2', 'radiation', 'bone',
];

export const HAZARDS: Record<HazardId, { label: string; blurb: string; evidenceId: string; priority: IndicatorId[] }> = {
  radiation: {
    label: 'Space Radiation',
    blurb: 'Exposure to ionizing radiation beyond Earth’s protection is tracked as cumulative effective dose against NASA’s career reference, which is a long-term limit and not a statement about acute events.',
    evidenceId: 'nasa_hrp_hazards',
    priority: ['radiation'],
  },
  gravity: {
    label: 'Gravity Fields',
    blurb: 'Changed gravity affects the body’s bones, muscles and cardiovascular system. ASTRAMED tracks heart rate, blood pressure, activity and a simulated bone estimate; NASA exercise hardware exists to counter these changes.',
    evidenceId: 'nasa_exercise_countermeasures',
    priority: ['bone', 'activity', 'hr', 'bp_sys', 'bp_dia'],
  },
  isolation: {
    label: 'Isolation & Confinement',
    blurb: 'Long periods in a small crew affect sleep, workload and cognitive performance. Sleep and reaction-time latency are prioritised, in line with NASA’s Standard Measures categories.',
    evidenceId: 'nasa_standard_measures',
    priority: ['sleep', 'rt', 'activity', 'hr'],
  },
  hostile: {
    label: 'Hostile / Closed Environment',
    blurb: 'A closed habitat depends on life-support systems. Cabin CO₂ is compared with the NASA-STD-3001 one-hour limit; oxygen saturation is shown as supporting context.',
    evidenceId: 'nasa_co2_brief',
    priority: ['co2', 'spo2'],
  },
  distance: {
    label: 'Distance from Earth',
    blurb: 'Communication delay and evacuation time make crews more self-reliant. ASTRAMED therefore keeps its analysis local and offers on-board reassessment. Cognitive reaction time is shown as the indicator most useful for local follow-up.',
    evidenceId: 'nasa_hrp_hazards',
    priority: ['rt'],
  },
};

export const HAZARD_ORDER: HazardId[] = ['radiation', 'gravity', 'isolation', 'hostile', 'distance'];
