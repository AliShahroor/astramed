import type { EvidenceRecord } from '../types';

/**
 * Local, packaged evidence library. Every record cites the original NASA page.
 * `verified` is true only where the exact value/wording was read from the NASA page (see docs/scientific-sources).
 * Statements are short paraphrases, not reproductions.
 */
export const EVIDENCE: EvidenceRecord[] = [
  {
    id: 'nasa_co2_brief',
    agency: 'NASA',
    title: 'OCHMO-TB-004 Carbon Dioxide (CO₂) technical brief',
    url: 'https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/',
    documentVersion: 'Page updated Mar 2026; PDF uploaded Dec 2023; cites NASA-STD-3001 Vol 2',
    section: 'Requirement V2 6004 (CO₂ partial pressure in the habitable volume)',
    evidenceType: 'standard',
    indicators: ['co2'],
    statement:
      'NASA-STD-3001 requirement V2 6004 limits the one-hour average CO₂ partial pressure in the habitable volume to 3 mmHg. The brief gives 0.5% CO₂ ≈ 3.8 mmHg as a conversion.',
    unit: 'mmHg',
    aggregation: 'one_hour_average',
    limit: 3,
    applicability:
      'Habitable volume of NASA spacecraft; applies to a one-hour average partial pressure, not to an instantaneous reading.',
    limitations: [
      'The brief words the limit as both “<3 mmHg” and “should not exceed”; ASTRAMED flags values strictly greater than 3 mmHg.',
      'Fixed sensors can miss local CO₂ pockets, and individual sensitivity varies.',
      'Symptom data on the brief are observational and described as anecdotal; they are not used as thresholds here.',
      'Exact requirement text per Vol 2 revision (C/D/F) was not read from the standard itself.',
    ],
    verified: true,
    verificationNote: 'Limit, unit and averaging time read from the NASA brief page (verification pass, see evidence-mapping.md).',
    supports: 'Cabin CO₂ finding (NASA-derived rule).',
  },
  {
    id: 'nasa_radiation_brief',
    agency: 'NASA',
    title: 'OCHMO-TB-020 Design for Ionizing Radiation Protection (technical brief)',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf',
    documentVersion: 'Rev E, 12/27/2022; quotes NASA-STD-3001 Vol 1 Rev B',
    section: 'Requirement V1 4030, Career Space Permissible Exposure Limit',
    evidenceType: 'standard',
    indicators: ['radiation'],
    statement:
      'V1 4030 states that an astronaut’s total career effective dose from spaceflight radiation shall be less than 600 mSv, stated as universal for all ages and sexes.',
    unit: 'mSv',
    aggregation: 'cumulative_career_effective_dose',
    limit: 600,
    applicability: 'Career effective dose from spaceflight radiation. Effective dose uses NASA’s cancer-risk model parameters.',
    limitations: [
      'A career limit does not describe the safety of any single acute exposure; separate limits exist for solar particle events (V1 4031).',
      'The brief notes the galactic cosmic radiation limit is “under consideration”.',
      'Earlier standard revisions reportedly used different (age- and sex-dependent) limits; they are not used here.',
      'ASTRAMED’s dose values are synthetic.',
    ],
    verified: true,
    verificationNote: 'Value and wording read in full from the NASA technical brief PDF.',
    supports: 'Career dose utilization indicator.',
  },
  {
    id: 'nasa_standard_measures',
    agency: 'NASA',
    title: 'Spaceflight Standard Measures',
    url: 'https://www.nasa.gov/reference/standard-measures/',
    documentVersion: 'Web page (no revision stated)',
    section: 'Measurement categories',
    evidenceType: 'measurement_protocol',
    indicators: ['sleep', 'rt', 'activity'],
    statement:
      'Standard Measures is a standardized set of measurements collected across body systems at repeated time points to study how spaceflight affects health and performance. Listed categories include activity and light exposure, sleep reports and cognitive function tests.',
    applicability: 'Research data-collection protocol used to justify which categories ASTRAMED monitors longitudinally.',
    limitations: [
      'It is a data-collection protocol, not a standard with thresholds. No numeric alert limit is derived from it.',
    ],
    verified: true,
    verificationNote: 'Category list read from the NASA page.',
    supports: 'Why sleep, activity and cognitive performance are tracked against a personal baseline.',
  },
  {
    id: 'nasa_hrp_hazards',
    agency: 'NASA',
    title: '5 Hazards of Human Spaceflight (Human Research Program)',
    url: 'https://www.nasa.gov/hrp/hazards/',
    documentVersion: 'Web page (no revision stated)',
    section: 'Five hazards',
    evidenceType: 'program_resource',
    indicators: ['radiation', 'bone', 'sleep', 'rt', 'co2'],
    statement:
      'NASA’s Human Research Program groups spaceflight health risks into five hazards: space radiation, isolation and confinement, distance from Earth, gravity fields, and hostile/closed environments.',
    applicability: 'Organising framework for the hazard filters.',
    limitations: ['ASTRAMED’s mapping of individual indicators to hazards is a prototype choice, not a NASA taxonomy.'],
    verified: true,
    verificationNote: 'Hazard names read from the NASA page.',
    supports: 'Hazard filter labels.',
  },
  {
    id: 'nasa_sleep_risk',
    agency: 'NASA',
    title: 'Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload',
    url: 'https://www.nasa.gov/directorates/esdmd/hhp/risk-of-performance-decrements-and-adverse-health-outcomes-resulting-from-sleep-loss-circadian-desynchronization-and-work-overload',
    documentVersion: 'Page updated Sep 2025; links the April 2016 Evidence Report',
    section: 'Risk overview',
    evidenceType: 'research_finding',
    indicators: ['sleep', 'rt'],
    statement:
      'NASA’s Human Research Program treats sleep loss, circadian desynchronization and work overload as a spaceflight risk to performance and health. The evidence is observational and ground-based; it supports monitoring sleep and cognitive performance but gives no cutoff for any particular test.',
    applicability: 'Background for why reduced sleep and slower responses are examined together.',
    limitations: [
      'Association only. It does not show that sleep loss caused a particular change in a particular astronaut.',
      'No numeric thresholds were verified.',
      'The 2016 evidence report PDF itself was not opened during verification.',
    ],
    verified: true,
    verificationNote: 'NASA risk page opened; the linked evidence report PDF was not read.',
    supports: 'Context on the reaction-time and sleep findings.',
  },
  {
    id: 'nasa_pvt_task',
    agency: 'NASA',
    title: 'Psychomotor Vigilance Test (PVT) on ISS (Reaction Self-Test on ISS-12)',
    url: 'https://humanresearchroadmap.nasa.gov/Tasks/task.aspx?i=1651',
    documentVersion: 'Task status Completed; last published 05/13/25',
    section: 'Task description',
    evidenceType: 'research_finding',
    indicators: ['rt'],
    statement:
      'NASA studied a PVT-based Reaction Self-Test on the ISS to obtain objective data on fatigue and workload effects over a year-long mission and to validate it as an objective fatigue measure.',
    applicability: 'Shows that NASA uses short reaction-time tests as an objective fatigue-related measure.',
    limitations: [
      'ASTRAMED’s browser reaction-time task is a prototype inspired by vigilance testing. It is not the NASA PVT and is not clinically validated.',
      'Only the first part of the HRR task page was read during verification.',
    ],
    verified: true,
    verificationNote: 'Title, purpose and associated risks read from the NASA task page (partial read).',
    supports: 'Reaction-time assessment design and interpretation.',
  },
  {
    id: 'nasa_bone_page',
    agency: 'NASA',
    title: 'Bone and Mineral Evaluation and Analysis',
    url: 'https://www.nasa.gov/content/bone-and-mineral-evaluation-and-analysis',
    documentVersion: 'Published Mar 2023; updated Jul 2024',
    section: 'Overview',
    evidenceType: 'research_finding',
    indicators: ['bone'],
    statement:
      'NASA describes astronauts losing bone density, quoted as up to 1–2% per month in the hip and spine, in reduced gravity. This is a general-audience statement without mission-duration conditions.',
    applicability: 'Background only. It is not a validated cumulative trajectory.',
    limitations: [
      'Rates depend on mission length and exercise countermeasure use.',
      'ASTRAMED therefore draws no expected-trajectory line for bone.',
    ],
    verified: true,
    verificationNote: 'Statement read from the NASA page; judged too general to use as a reference line.',
    supports: 'Background for the bone estimate; no threshold.',
  },
  {
    id: 'nasa_exercise_countermeasures',
    agency: 'NASA',
    title: 'Exercise Countermeasures',
    url: 'https://www.nasa.gov/reference/jsc-exercise-countermeasures/',
    documentVersion: 'Web page (no revision stated)',
    section: 'ISS exercise hardware',
    evidenceType: 'program_resource',
    indicators: ['activity', 'bone'],
    statement:
      'NASA lists ISS exercise hardware used as countermeasures: the Advanced Resistive Exercise Device (ARED), the second-generation treadmill (T2/COLBERT), and a cycle ergometer (CEVIS).',
    applicability: 'Equipment context for illustrative activities in Countermeasures.',
    limitations: [
      'ASTRAMED’s activity library is illustrative. Exercise prescriptions follow mission procedures and are not reproduced here.',
    ],
    verified: true,
    verificationNote: 'Hardware names read from the NASA page.',
    supports: 'Equipment context of illustrative physical activities.',
  },
  {
    id: 'nasa_osdr',
    agency: 'NASA',
    title: 'NASA Open Science Data Repository (OSDR)',
    url: 'https://osdr.nasa.gov/',
    documentVersion: 'Redirects to NASA Science biological and physical science data page',
    section: 'Repository overview',
    evidenceType: 'data_repository',
    indicators: [],
    statement: 'OSDR gives open access to NASA biological and physical science datasets from spaceflight and ground studies.',
    applicability: 'Potential source of public datasets.',
    limitations: [
      'No OSDR dataset is used in this prototype. All astronaut measurements are synthetic.',
      'Page wording was paraphrased from a summary and is not independently verified.',
    ],
    verified: false,
    verificationNote: 'Listed as a future data source only; not used in any calculation.',
    supports: 'Future work.',
  },
];

export const EVIDENCE_BY_ID: Record<string, EvidenceRecord> = Object.fromEntries(EVIDENCE.map((e) => [e.id, e]));

export const CO2_LIMIT_MMHG = EVIDENCE_BY_ID.nasa_co2_brief.limit as number;
export const CAREER_DOSE_LIMIT_MSV = EVIDENCE_BY_ID.nasa_radiation_brief.limit as number;
