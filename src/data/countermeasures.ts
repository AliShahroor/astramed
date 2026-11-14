export interface Activity {
  id: string;
  name: string;
  purpose: string;
  minutes: number;
  equipment: string;
  safety: string;
  nasaEquipment: boolean;
}

/** Illustrative demonstration routines. Durations and purposes are not NASA exercise prescriptions. */
export const ACTIVITIES: Activity[] = [
  { id: 'resist', name: 'Resistance session', purpose: 'Strength maintenance (illustrative)', minutes: 30, equipment: 'Resistive exercise device. On the ISS NASA uses ARED.', safety: 'Follow mission exercise procedures for loads and restraints. Stop if you feel pain or dizziness.', nasaEquipment: true },
  { id: 'treadmill', name: 'Harnessed treadmill session', purpose: 'Cardiovascular and lower-body loading (illustrative)', minutes: 30, equipment: 'Treadmill with harness. On the ISS NASA uses T2/COLBERT.', safety: 'Check harness fit before starting. Use the mission’s speed and load procedures.', nasaEquipment: true },
  { id: 'cycle', name: 'Cycle ergometer session', purpose: 'Aerobic conditioning (illustrative)', minutes: 20, equipment: 'Cycle ergometer. On the ISS NASA lists CEVIS.', safety: 'Keep feet secured. Reduce effort if heart rate feels uncomfortably high.', nasaEquipment: true },
  { id: 'mobility', name: 'Mobility and posture routine', purpose: 'Joint mobility and posture', minutes: 10, equipment: 'No equipment', safety: 'Move slowly; avoid forcing any range of motion.', nasaEquipment: false },
  { id: 'break', name: 'Movement break', purpose: 'Break up long sedentary stretches', minutes: 5, equipment: 'No equipment', safety: 'Stay clear of workstations and handrails you do not need.', nasaEquipment: false },
  { id: 'recovery', name: 'Recovery stretching and breathing', purpose: 'Cool-down and relaxation', minutes: 10, equipment: 'No equipment', safety: 'Stop any stretch that causes pain.', nasaEquipment: false },
];

/** Seeded, synthetic prior participation (sessions per crew member, days 85-93) for the voluntary participation view. */
export const SEED_PARTICIPATION: Record<string, { sessions: number; days: number[] }> = {
  alex: { sessions: 9, days: [87, 88, 89, 91, 92, 93] },
  sana: { sessions: 13, days: [85, 86, 87, 88, 89, 90, 91, 92, 93] },
  jonas: { sessions: 15, days: [85, 86, 87, 88, 89, 90, 91, 92, 93] },
  mei: { sessions: 6, days: [86, 89, 92, 93] },
};
