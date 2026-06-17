import {
  evaluateV1NotificationDecision,
  parseNumericSensor,
  type NotificationDecisionLevel,
} from './notificationDecisionEngine';
import {
  findNotificationConfigForZoneRow,
  getNotificationConfigById,
  thresholdsFromConfig,
} from './zoneNotificationConfigStorage';

/**
 * Decision level (ok / advisory / critical) for one notification row.
 *
 * Mirrors the per-card computation in ``Notification.tsx`` so the
 * notifications feed can filter by level without each card reporting up.
 * Resolution order matches the card: explicit config id first, then the
 * zone's stored config. Returns ``null`` for confirmation rows
 * (``template_summary``) which carry no sensor readings to evaluate.
 */
export function decisionLevelForNotification(params: {
  et0: string;
  soilHumidity: string;
  configId?: string;
  zoneId?: number;
  notificationName?: string;
  isTemplateSummary?: boolean;
}): NotificationDecisionLevel | null {
  if (params.isTemplateSummary) return null;

  const cid = params.configId?.trim();
  const config = cid
    ? getNotificationConfigById(cid)
    : params.zoneId != null
      ? findNotificationConfigForZoneRow(params.zoneId, params.notificationName)
      : undefined;

  const kc = config?.kc ?? 1;
  const thresholds = thresholdsFromConfig(config);
  return evaluateV1NotificationDecision({
    et0Mm: parseNumericSensor(params.et0),
    soilHumidityPct: parseNumericSensor(params.soilHumidity),
    kc,
    thresholds,
  }).decision;
}
