'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import useColorModeStyles from '@/app/utils/useColorModeStyles';
import {
  evaluateV1NotificationDecision,
  logDecisionToConsole,
  parseNumericSensor,
  type DecisionEngineResult,
  type NotificationDecisionLevel,
} from '@/app/lib/notificationDecisionEngine';
import {
  findNotificationConfigForZoneRow,
  getNotificationConfigById,
  thresholdsFromConfig,
  ZONE_NOTIFICATION_CONFIG_UPDATED_EVENT,
} from '@/app/lib/zoneNotificationConfigStorage';

export interface NotificationPayload {
  yesterday_temperature: string;
  today_temperature: string;
  yesterday_humidity: string;
  today_humidity: string;
  ET0: string;
  soil_humidity: string;
  soil_temperature: string;
  soil_ph: string;
  perfect_irrigation_period: string;
  last_irrigation_date: string;
  last_start_irrigation_hour: string;
  last_finish_irrigation_hour: string;
  used_water_irrigation: string;
  notification_date: string;
  /** When present (API), binds this card to stored zone notification config & bell counts. */
  zone_id?: number;
  zone_name?: string;
  /** Binds this row to one stored notification configuration (secteur). */
  notification_config_id?: string;
  /** Optional API field to disambiguate when several configs share a zone. */
  notification_name?: string;
  /** Local confirmation row after saving zone notification config. */
  template_summary?: string;
}

interface NotificationProps {
  id: number;
  notification: NotificationPayload;
  is_read: boolean;
  read_at: string | null;
  /** Ouvre l’édition de la configuration correspondant à cette carte. */
  onEditZone?: () => void;
  /** Demande la suppression de la configuration locale pour cette carte. */
  onDeleteZone?: () => void;
}

const localeTag = (locale: string): string =>
  locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';

/** colorScheme name for the decision level (badges / accents). */
const decisionScheme = (d: NotificationDecisionLevel) => {
  if (d === 'critical') return 'red';
  if (d === 'advisory') return 'orange';
  return 'green';
};

/** One compact reading tile: icon + label, big value + unit, optional delta caption. */
const StatTile: React.FC<{
  icon: string;
  label: string;
  value: string;
  unit?: string;
  sub?: string | null;
  subColor?: string;
}> = ({ icon, label, value, unit, sub, subColor }) => {
  const tileBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const tileBorder = useColorModeValue('neutral.200', 'whiteAlpha.200');
  const muted = useColorModeValue('neutral.500', 'neutral.400');
  return (
    <Box
      bg={tileBg}
      borderWidth="1px"
      borderColor={tileBorder}
      borderRadius="lg"
      px={3}
      py={2.5}
    >
      <HStack spacing={1.5} mb={1} color={muted} minH="18px">
        <Text fontSize="sm" lineHeight="1" aria-hidden>
          {icon}
        </Text>
        <Text
          fontSize="xs"
          fontWeight="medium"
          noOfLines={1}
          textTransform="uppercase"
          letterSpacing="0.02em"
        >
          {label}
        </Text>
      </HStack>
      <HStack align="baseline" spacing={1}>
        <Text fontSize="xl" fontWeight="bold" lineHeight="1.1">
          {value}
        </Text>
        {unit && (
          <Text fontSize="xs" color={muted} fontWeight="medium">
            {unit}
          </Text>
        )}
      </HStack>
      {sub && (
        <Text fontSize="xs" color={subColor ?? muted} mt={1} noOfLines={1}>
          {sub}
        </Text>
      )}
    </Box>
  );
};

const Notification: React.FC<NotificationProps> = ({
  id,
  notification,
  is_read: isRead,
  onEditZone,
  onDeleteZone,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const decisionLabel = (d: NotificationDecisionLevel) => {
    if (d === 'critical') return t('notifications.card.decisionCritical');
    if (d === 'advisory') return t('notifications.card.decisionAdvisory');
    return t('notifications.card.decisionOk');
  };
  const decisionTag = (d: NotificationDecisionLevel) => {
    if (d === 'critical') return t('notifications.card.tagCritical');
    if (d === 'advisory') return t('notifications.card.tagAdvisory');
    return t('notifications.card.tagOk');
  };
  const { bg, textColor } = useColorModeStyles();
  const muted = useColorModeValue('neutral.500', 'neutral.400');
  const cardBorder = useColorModeValue('neutral.200', 'neutral.700');
  const irrigBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const upColor = useColorModeValue('red.500', 'red.300');
  const downColor = useColorModeValue('blue.500', 'blue.300');

  const notificationDate = new Date(notification.notification_date);
  const formattedDate = notificationDate.toLocaleString(localeTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const [engineResult, setEngineResult] = useState<DecisionEngineResult | null>(
    null
  );

  const zoneId = notification.zone_id;
  const [configRev, setConfigRev] = useState(0);

  useEffect(() => {
    const bump = () => setConfigRev((n) => n + 1);
    window.addEventListener(ZONE_NOTIFICATION_CONFIG_UPDATED_EVENT, bump);
    return () =>
      window.removeEventListener(ZONE_NOTIFICATION_CONFIG_UPDATED_EVENT, bump);
  }, []);

  const config = useMemo(() => {
    const cid = notification.notification_config_id?.trim();
    if (cid) return getNotificationConfigById(cid);
    if (zoneId == null) return undefined;
    return findNotificationConfigForZoneRow(
      zoneId,
      notification.notification_name
    );
  }, [
    zoneId,
    notification.notification_config_id,
    notification.notification_name,
    configRev,
  ]);

  const configName = config?.notificationName?.trim() ?? '';
  const secteur = config?.secteurLabel?.trim() ?? '';
  // Title prefers the config name (+ secteur); otherwise falls back to the
  // zone name, then a zone number, so the header is never the "unnamed config"
  // placeholder while a perfectly good zone name sits redundantly below it.
  const title =
    configName.length > 0
      ? secteur
        ? `${configName} — ${secteur}`
        : configName
      : notification.zone_name?.trim() ||
        (zoneId != null
          ? t('notifications.card.zoneNumber', { id: zoneId })
          : t('notifications.card.notificationFallback'));
  const showLocationSub =
    Boolean(notification.zone_name?.trim()) &&
    title !== notification.zone_name?.trim();

  useEffect(() => {
    if (notification.template_summary) {
      setEngineResult(null);
      return;
    }
    const kc = config?.kc ?? 1;
    const thresholds = thresholdsFromConfig(config);
    const result = evaluateV1NotificationDecision({
      et0Mm: parseNumericSensor(notification.ET0),
      soilHumidityPct: parseNumericSensor(notification.soil_humidity),
      kc,
      thresholds,
    });
    logDecisionToConsole(result, `notification id=${id}`);
    setEngineResult(result);
  }, [
    id,
    notification.ET0,
    notification.soil_humidity,
    zoneId,
    config?.kc,
    config?.criticalThresholdPct,
    config?.et0KcAdvisoryMm,
    notification.template_summary,
  ]);

  const scheme = engineResult ? decisionScheme(engineResult.decision) : 'gray';
  const accent = `${scheme}.400`;

  // Color-mode values must be computed unconditionally (rules of hooks).
  const confirmBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const confirmBorder = useColorModeValue('blue.100', 'whiteAlpha.200');
  const bannerBg = useColorModeValue(`${scheme}.50`, 'whiteAlpha.100');
  const bannerBorder = useColorModeValue(`${scheme}.200`, 'whiteAlpha.200');

  /** Short "▲ 1.2°C vs hier" caption when both readings are numeric. */
  const delta = (
    today: string,
    yesterday: string,
    unit: string
  ): { text: string; color: string } | null => {
    const a = parseFloat(today);
    const b = parseFloat(yesterday);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    const d = a - b;
    if (Math.abs(d) < 0.05)
      return { text: `= ${t('notifications.card.vsYesterday')}`, color: muted };
    const arrow = d > 0 ? '▲' : '▼';
    return {
      text: `${arrow} ${Math.abs(d).toFixed(1)}${unit} ${t('notifications.card.vsYesterday')}`,
      color: d > 0 ? upColor : downColor,
    };
  };
  const tempDelta = delta(
    notification.today_temperature,
    notification.yesterday_temperature,
    '°C'
  );
  const humDelta = delta(
    notification.today_humidity,
    notification.yesterday_humidity,
    '%'
  );

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={cardBorder}
      borderInlineStartWidth="5px"
      borderInlineStartColor={accent}
      borderRadius="xl"
      boxShadow="sm"
      color={textColor}
      overflow="hidden"
      transition="box-shadow 0.15s ease, transform 0.15s ease"
      _hover={{ boxShadow: 'md' }}
    >
      <Box p={{ base: 4, md: 5 }}>
        {/* Header: title + meta on the left, status tag on the right */}
        <Flex justify="space-between" align="flex-start" gap={3}>
          <Box minW={0}>
            <HStack spacing={2} align="center">
              {!isRead && (
                <Box
                  w="9px"
                  h="9px"
                  borderRadius="full"
                  bg="primary.500"
                  flexShrink={0}
                  aria-label={t('notifications.card.unread')}
                  title={t('notifications.card.unread')}
                />
              )}
              <Text
                fontWeight="bold"
                fontSize="lg"
                lineHeight="short"
                noOfLines={2}
              >
                {title}
              </Text>
            </HStack>
            <HStack
              spacing={3}
              mt={1.5}
              color={muted}
              fontSize="sm"
              flexWrap="wrap"
            >
              {showLocationSub && (
                <HStack spacing={1} minW={0}>
                  <Text aria-hidden>📍</Text>
                  <Text noOfLines={1}>{notification.zone_name}</Text>
                </HStack>
              )}
              <HStack spacing={1}>
                <Text aria-hidden>🕑</Text>
                <Text>{formattedDate}</Text>
              </HStack>
            </HStack>
          </Box>
          {engineResult && (
            <Badge
              colorScheme={scheme}
              variant="solid"
              borderRadius="full"
              px={3}
              py={1}
              fontSize="xs"
              flexShrink={0}
            >
              {decisionTag(engineResult.decision)}
            </Badge>
          )}
        </Flex>

        {/* Zone-config save confirmation rows */}
        {notification.template_summary && (
          <Box
            mt={4}
            p={3}
            borderRadius="lg"
            bg={confirmBg}
            borderWidth="1px"
            borderColor={confirmBorder}
          >
            <Badge colorScheme="brand" mb={2}>
              {t('notifications.card.zoneConfirmation')}
            </Badge>
            <Text fontSize="sm">{notification.template_summary}</Text>
          </Box>
        )}

        {/* Decision banner — irrigation verdict, prominent */}
        {engineResult && (
          <Box
            mt={4}
            px={3}
            py={2.5}
            borderRadius="lg"
            bg={bannerBg}
            borderWidth="1px"
            borderColor={bannerBorder}
          >
            <Text fontSize="sm" fontWeight="semibold">
              {decisionLabel(engineResult.decision)}
            </Text>
            <Text fontSize="xs" color={muted} mt={0.5}>
              ETo×Kc ={' '}
              {Number.isFinite(engineResult.et0TimesKc)
                ? engineResult.et0TimesKc.toFixed(3)
                : t('notifications.card.noData')}{' '}
              mm · {t('notifications.card.kcUsed', { kc: config?.kc ?? 1 })}
            </Text>
            {engineResult.rulesFired.length > 0 && (
              <Text fontSize="xs" color={muted} mt={0.5} noOfLines={1}>
                {t('notifications.card.rulesLabel')}{' '}
                {engineResult.rulesFired.join(', ')}
              </Text>
            )}
          </Box>
        )}

        {/* Readings — compact scannable tiles */}
        {!notification.template_summary && (
          <Box mt={4}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color={muted}
              textTransform="uppercase"
              letterSpacing="0.04em"
              mb={2}
            >
              {t('notifications.card.metricsHeading')}
            </Text>
            <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2.5}>
              <StatTile
                icon="🌡️"
                label={t('notifications.card.airTemperature')}
                value={notification.today_temperature}
                unit="°C"
                sub={tempDelta?.text}
                subColor={tempDelta?.color}
              />
              <StatTile
                icon="💧"
                label={t('notifications.card.airHumidity')}
                value={notification.today_humidity}
                unit="%"
                sub={humDelta?.text}
                subColor={humDelta?.color}
              />
              <StatTile
                icon="🔆"
                label={t('notifications.card.et0Label')}
                value={notification.ET0}
                unit="mm"
              />
              <StatTile
                icon="🌱"
                label={t('notifications.card.soilMoisture')}
                value={notification.soil_humidity}
                unit="%"
              />
              <StatTile
                icon="🌡️"
                label={t('notifications.card.soilTemperature')}
                value={notification.soil_temperature}
                unit="°C"
              />
              <StatTile
                icon="⚗️"
                label={t('notifications.card.soilPh')}
                value={notification.soil_ph}
              />
            </SimpleGrid>
          </Box>
        )}

        {/* Irrigation strip */}
        {!notification.template_summary && (
          <Box
            mt={3}
            px={3}
            py={3}
            borderRadius="lg"
            bg={irrigBg}
            borderWidth="1px"
            borderColor={cardBorder}
          >
            <HStack mb={2} spacing={1.5}>
              <Text aria-hidden>🚰</Text>
              <Text fontSize="sm" fontWeight="semibold">
                {t('notifications.card.irrigation')}
              </Text>
            </HStack>
            <SimpleGrid
              columns={{ base: 1, sm: 3 }}
              spacing={{ base: 1.5, sm: 3 }}
            >
              <VStack align="stretch" spacing={0.5}>
                <Text fontSize="xs" color={muted}>
                  {t('notifications.card.idealPeriod')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {notification.perfect_irrigation_period}
                </Text>
              </VStack>
              <VStack align="stretch" spacing={0.5}>
                <Text fontSize="xs" color={muted}>
                  {t('notifications.card.lastDate')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {notification.last_irrigation_date}
                </Text>
              </VStack>
              <VStack align="stretch" spacing={0.5}>
                <Text fontSize="xs" color={muted}>
                  {t('notifications.card.usedWater')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {notification.used_water_irrigation} L
                </Text>
              </VStack>
            </SimpleGrid>
          </Box>
        )}

        {/* Footer actions */}
        {zoneId != null && (onEditZone || onDeleteZone) && (
          <HStack spacing={3} mt={4} justify="flex-end" flexWrap="wrap">
            {onEditZone && (
              <Button
                size="sm"
                colorScheme="brand"
                variant="solid"
                borderRadius="lg"
                onClick={() => onEditZone()}
              >
                {t('notifications.card.editNotification')}
              </Button>
            )}
            {onDeleteZone && (
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                borderRadius="lg"
                onClick={() => onDeleteZone()}
              >
                {t('notifications.card.deleteNotification')}
              </Button>
            )}
          </HStack>
        )}
      </Box>
    </Box>
  );
};

export default Notification;
