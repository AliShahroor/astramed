import type { CrewNotification, HealthFinding } from '../types';

/**
 * Notification policy v1.0 (prototype):
 * - Any alert-level finding creates a crew-visible notification. Cabin-level alerts are raised once, for the cabin.
 * - Review-level findings reach the crew only when an astronaut has two or more active review findings.
 * - A single review finding stays with the individual.
 * Notification text never includes measurements.
 */
export const NOTIFY_POLICY_VERSION = 'notify-policy-1.0';

export function deriveNotifications(findingsByAstronaut: Record<string, HealthFinding[]>, t: number, names: Record<string, string>): CrewNotification[] {
  const out: CrewNotification[] = [];
  let cabinDone = false;
  for (const [id, findings] of Object.entries(findingsByAstronaut)) {
    const alerts = findings.filter((f) => f.status === 'alert');
    const cabin = alerts.filter((f) => f.ruleOrigin === 'nasa_standard');
    const personalAlerts = alerts.filter((f) => f.ruleOrigin !== 'nasa_standard');
    if (cabin.length && !cabinDone) {
      cabinDone = true;
      out.push({ id: 'cabin:environment', kind: 'environment', astronautId: 'cabin', text: 'Cabin environment reading is above a NASA reference limit. Verify and follow environmental-control procedures.', findingIds: cabin.map((f) => f.id), t });
    }
    const reviews = findings.filter((f) => f.status === 'review');
    if (personalAlerts.length || reviews.length >= 2) {
      out.push({ id: `${id}:attention`, kind: 'attention', astronautId: id, text: `${names[id] ?? id} has an attention notification. Please check in.`, findingIds: [...personalAlerts, ...reviews].map((f) => f.id), t });
    }
  }
  return out;
}
