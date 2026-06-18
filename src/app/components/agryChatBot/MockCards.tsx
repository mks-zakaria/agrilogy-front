'use client';
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { COMMANDS } from './mockEngine';
import {
  MOCK_ALERTS,
  MOCK_FARM_STATUS,
  MOCK_IRRIGATION,
  MOCK_NOTIFICATIONS,
  MOCK_PLANT,
  MOCK_SOIL,
  MOCK_TREND,
  MOCK_WATER,
  MOCK_WEATHER,
  MOCK_ZONES,
  type AlertRow,
  type IrrigationRow,
  type MetricRow,
  type NotificationRow,
  type Severity,
  type TrendRow,
  type ZoneRow,
} from './mockData';
import { useChat } from './ChatContext';

function useSeverityColor() {
  const critical = useColorModeValue('red.500', 'red.300');
  const warning = useColorModeValue('orange.500', 'orange.300');
  const ok = useColorModeValue('green.500', 'green.300');
  const muted = useColorModeValue('gray.400', 'gray.500');
  return (s?: Severity) =>
    s === 'critical'
      ? critical
      : s === 'warning'
        ? warning
        : s === 'ok'
          ? ok
          : muted;
}

/** Localized sensor label by stable key, falling back to the backend label. */
function useSensorLabel() {
  const t = useTranslations();
  return (key: string, fallback = '') => {
    const k = `misc.chatbot.data.sensor.${key}`;
    return t.has(k) ? t(k) : fallback || key;
  };
}

const fmt = (value: number | null, unit: string) =>
  value == null ? '—' : `${value} ${unit}`;

const rowStyle = (cardBg: string, cardBorder: string) => ({
  px: '10px',
  py: '7px',
  bg: cardBg,
  border: '1px solid',
  borderColor: cardBorder,
  borderRadius: '8px',
});

/** /help — the full command surface; each row runs the command when clicked. */
export const CommandsCard = () => {
  const t = useTranslations();
  const { sendMessage } = useChat();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const slashColor = useColorModeValue('green.600', 'green.300');
  const slashHover = useColorModeValue('green.700', 'green.200');
  const descColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t('misc.chatbot.commandsCard.title')}
      </Text>
      {COMMANDS.map((c) => (
        <Box
          key={c.name}
          as="button"
          type="button"
          onClick={() => sendMessage(c.slash)}
          textAlign="start"
          {...rowStyle(cardBg, cardBorder)}
          cursor="pointer"
          transition="all 0.15s"
          _hover={{ borderColor: slashHover, transform: 'translateX(2px)' }}
        >
          <Text
            fontSize="12.5px"
            fontWeight={600}
            color={slashColor}
            fontFamily="mono"
          >
            {c.slash}
          </Text>
          <Text fontSize="11px" color={descColor}>
            {t(c.descKey)}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

/** /alerts — the caller's active alerts (from the get_active_alerts tool). */
export const AlertsCard = ({
  alerts = MOCK_ALERTS.alerts,
}: {
  alerts?: AlertRow[];
}) => {
  const t = useTranslations();
  const sevColor = useSeverityColor();
  const sensorLabel = useSensorLabel();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const nameColor = useColorModeValue('gray.800', 'gray.100');
  const metaColor = useColorModeValue('gray.500', 'gray.400');
  const emptyColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t('misc.chatbot.alertsCard.title')}
      </Text>
      {alerts.length === 0 ? (
        <Text fontSize="12px" color={emptyColor}>
          {t('misc.chatbot.alertsCard.empty')}
        </Text>
      ) : (
        alerts.map((a) => {
          const cond =
            a.condition && a.threshold != null
              ? `${a.condition} ${a.threshold}`
              : '';
          return (
            <Flex
              key={a.id}
              align="center"
              gap="8px"
              {...rowStyle(cardBg, cardBorder)}
            >
              <Box
                w="8px"
                h="8px"
                borderRadius="50%"
                bg={sevColor(a.severity)}
                flexShrink={0}
              />
              <Box flex={1} minW={0}>
                <Text
                  fontSize="12.5px"
                  fontWeight={600}
                  color={nameColor}
                  noOfLines={1}
                >
                  {a.name || sensorLabel(a.sensor_key)}
                </Text>
                <Text fontSize="11px" color={metaColor}>
                  {[a.zone, sensorLabel(a.sensor_key)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Box>
              {cond && (
                <Text
                  fontSize="12.5px"
                  fontWeight={700}
                  color={sevColor(a.severity)}
                  fontFamily="mono"
                >
                  {cond}
                </Text>
              )}
            </Flex>
          );
        })
      )}
    </Box>
  );
};

/** /status — snapshot of key metrics (from the get_farm_status tool). The
 *  same grid renders the per-domain soil/plant/water snapshots, varying only
 *  the heading via `titleKey`. */
export const FarmStatusCard = ({
  metrics = MOCK_FARM_STATUS.metrics,
  titleKey = 'misc.chatbot.statusCard.title',
}: {
  metrics?: MetricRow[];
  titleKey?: string;
}) => {
  const t = useTranslations();
  const sevColor = useSeverityColor();
  const sensorLabel = useSensorLabel();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t(titleKey)}
      </Text>
      <SimpleGrid columns={2} spacing="6px">
        {metrics.map((m) => (
          <Box key={m.key} {...rowStyle(cardBg, cardBorder)}>
            <Text fontSize="10.5px" color={labelColor} noOfLines={1}>
              {sensorLabel(m.key, m.label)}
            </Text>
            <Text
              fontSize="14px"
              fontWeight={700}
              color={sevColor(m.status)}
              fontFamily="mono"
            >
              {fmt(m.value, m.unit)}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

/** /soil — latest soil readings (from the get_soil_status tool). */
export const SoilCard = ({
  metrics = MOCK_SOIL.metrics,
}: {
  metrics?: MetricRow[];
}) => (
  <FarmStatusCard metrics={metrics} titleKey="misc.chatbot.soilCard.title" />
);

/** /plant — latest plant/canopy readings (from the get_plant_status tool). */
export const PlantCard = ({
  metrics = MOCK_PLANT.metrics,
}: {
  metrics?: MetricRow[];
}) => (
  <FarmStatusCard metrics={metrics} titleKey="misc.chatbot.plantCard.title" />
);

/** /water — latest water readings (from the get_water_status tool). */
export const WaterCard = ({
  metrics = MOCK_WATER.metrics,
}: {
  metrics?: MetricRow[];
}) => (
  <FarmStatusCard metrics={metrics} titleKey="misc.chatbot.waterCard.title" />
);

/** /zones — the caller's zones (from the list_zones tool). */
export const ZonesCard = ({
  zones = MOCK_ZONES.zones,
}: {
  zones?: ZoneRow[];
}) => {
  const t = useTranslations();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const nameColor = useColorModeValue('gray.800', 'gray.100');
  const metaColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('green.600', 'green.300');
  const emptyColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t('misc.chatbot.zonesCard.title')}
      </Text>
      {zones.length === 0 ? (
        <Text fontSize="12px" color={emptyColor}>
          {t('misc.chatbot.zonesCard.empty')}
        </Text>
      ) : (
        zones.map((z) => (
          <Flex
            key={z.id}
            align="center"
            gap="8px"
            {...rowStyle(cardBg, cardBorder)}
          >
            <Box flex={1} minW={0}>
              <Text
                fontSize="12.5px"
                fontWeight={600}
                color={nameColor}
                noOfLines={1}
              >
                {z.name}
              </Text>
              <Text fontSize="11px" color={metaColor}>
                {[
                  z.area_m2 != null
                    ? t('misc.chatbot.zonesCard.area', { value: z.area_m2 })
                    : null,
                  z.critical_moisture != null
                    ? t('misc.chatbot.zonesCard.critical', {
                        value: z.critical_moisture,
                      })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </Box>
            {z.area_m2 != null && (
              <Text
                fontSize="12.5px"
                fontWeight={700}
                color={valueColor}
                fontFamily="mono"
              >
                {z.area_m2} m²
              </Text>
            )}
          </Flex>
        ))
      )}
    </Box>
  );
};

/** /weather — latest weather-station readings (from the get_weather tool). */
export const WeatherCard = ({
  metrics = MOCK_WEATHER.metrics,
}: {
  metrics?: MetricRow[];
}) => {
  const t = useTranslations();
  const sensorLabel = useSensorLabel();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'gray.100');

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t('misc.chatbot.weatherCard.title')}
      </Text>
      {metrics.map((m) => (
        <Flex
          key={m.key}
          justify="space-between"
          align="center"
          {...rowStyle(cardBg, cardBorder)}
        >
          <Text fontSize="12px" color={labelColor}>
            {sensorLabel(m.key, m.label)}
          </Text>
          <Text
            fontSize="12.5px"
            fontWeight={600}
            color={valueColor}
            fontFamily="mono"
          >
            {fmt(m.value, m.unit)}
          </Text>
        </Flex>
      ))}
    </Box>
  );
};

/** /trend — rolling-window trend of one sensor (from the get_sensor_trend tool). */
export const TrendCard = ({ trend = MOCK_TREND }: { trend?: TrendRow }) => {
  const t = useTranslations();
  const sensorLabel = useSensorLabel();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'gray.100');
  const emptyColor = useColorModeValue('gray.400', 'gray.500');
  const rising = useColorModeValue('green.600', 'green.300');
  const falling = useColorModeValue('red.500', 'red.300');
  const flat = useColorModeValue('gray.500', 'gray.400');

  const title = t('misc.chatbot.trendCard.title');

  // No data (or unknown sensor) → graceful empty state.
  if (trend.error || trend.count === 0) {
    return (
      <Box display="flex" flexDirection="column" gap="6px" w="100%">
        <Text fontSize="13px" fontWeight={600} mb="2px">
          {title}
        </Text>
        <Text fontSize="12px" color={emptyColor}>
          {t('misc.chatbot.trendCard.empty')}
        </Text>
      </Box>
    );
  }

  const dirColor =
    trend.direction === 'rising'
      ? rising
      : trend.direction === 'falling'
        ? falling
        : flat;
  const dirArrow =
    trend.direction === 'rising'
      ? '↑'
      : trend.direction === 'falling'
        ? '↓'
        : '→';
  const stats: Array<[string, number | null]> = [
    [t('misc.chatbot.trendCard.min'), trend.min],
    [t('misc.chatbot.trendCard.avg'), trend.avg],
    [t('misc.chatbot.trendCard.max'), trend.max],
  ];

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {title}
      </Text>
      <Flex
        justify="space-between"
        align="center"
        {...rowStyle(cardBg, cardBorder)}
      >
        <Box minW={0}>
          <Text fontSize="12px" color={labelColor} noOfLines={1}>
            {sensorLabel(trend.key, trend.label)}
          </Text>
          <Text
            fontSize="18px"
            fontWeight={700}
            color={valueColor}
            fontFamily="mono"
          >
            {fmt(trend.latest, trend.unit)}
          </Text>
        </Box>
        <Flex align="center" gap="4px" color={dirColor} flexShrink={0}>
          <Text fontSize="18px" fontWeight={700}>
            {dirArrow}
          </Text>
          <Text fontSize="12px" fontWeight={600}>
            {t(`misc.chatbot.trendCard.${trend.direction}`)}
          </Text>
        </Flex>
      </Flex>
      <SimpleGrid columns={3} gap="6px">
        {stats.map(([lbl, val]) => (
          <Box key={lbl} {...rowStyle(cardBg, cardBorder)} textAlign="center">
            <Text fontSize="10px" color={labelColor} textTransform="uppercase">
              {lbl}
            </Text>
            <Text
              fontSize="12.5px"
              fontWeight={600}
              color={valueColor}
              fontFamily="mono"
            >
              {fmt(val, trend.unit)}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
      <Text fontSize="10px" color={labelColor}>
        {t('misc.chatbot.trendCard.count', { count: trend.count })}
      </Text>
    </Box>
  );
};

/** /irrigation — irrigate/hold recommendation (from get_irrigation_advice). */
export const IrrigationCard = ({
  advice = MOCK_IRRIGATION,
}: {
  advice?: IrrigationRow;
}) => {
  const t = useTranslations();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'gray.100');
  const reasonColor = useColorModeValue('gray.600', 'gray.300');
  const irrigateBg = useColorModeValue('green.500', 'green.400');
  const holdBg = useColorModeValue('gray.400', 'gray.500');
  const unknownBg = useColorModeValue('gray.300', 'gray.600');
  const badgeText = useColorModeValue('white', 'gray.900');

  const rec = advice.recommendation;
  const badgeBg =
    rec === 'irrigate' ? irrigateBg : rec === 'hold' ? holdBg : unknownBg;

  const figures: Array<[string, string]> = [];
  if (advice.soil_moisture_pct != null)
    figures.push([
      t('misc.chatbot.irrigationCard.soilMoisture'),
      `${advice.soil_moisture_pct} %`,
    ]);
  if (advice.critical_moisture_threshold != null)
    figures.push([
      t('misc.chatbot.irrigationCard.threshold'),
      `${advice.critical_moisture_threshold} %`,
    ]);
  if (advice.et0_mm != null)
    figures.push([t('misc.chatbot.irrigationCard.et0'), `${advice.et0_mm} mm`]);
  if (advice.vpd_kpa != null)
    figures.push([
      t('misc.chatbot.irrigationCard.vpd'),
      `${advice.vpd_kpa} kPa`,
    ]);
  if (advice.estimated_water_m3 != null)
    figures.push([
      t('misc.chatbot.irrigationCard.water'),
      `${advice.estimated_water_m3} m³`,
    ]);
  if (advice.estimated_duration_min != null)
    figures.push([
      t('misc.chatbot.irrigationCard.duration'),
      `${advice.estimated_duration_min} min`,
    ]);

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Flex align="center" justify="space-between" mb="2px">
        <Text fontSize="13px" fontWeight={600} noOfLines={1}>
          {advice.zone_name
            ? t('misc.chatbot.irrigationCard.titleZone', {
                zone: advice.zone_name,
              })
            : t('misc.chatbot.irrigationCard.title')}
        </Text>
        <Box
          px="9px"
          py="2px"
          bg={badgeBg}
          color={badgeText}
          borderRadius="999px"
          fontSize="11px"
          fontWeight={700}
          flexShrink={0}
        >
          {t(`misc.chatbot.irrigationCard.${rec}`)}
        </Box>
      </Flex>
      <Box {...rowStyle(cardBg, cardBorder)}>
        <Text fontSize="12px" color={reasonColor}>
          {advice.reason}
        </Text>
      </Box>
      {figures.length > 0 && (
        <SimpleGrid columns={2} gap="6px">
          {figures.map(([lbl, val]) => (
            <Flex
              key={lbl}
              justify="space-between"
              align="center"
              {...rowStyle(cardBg, cardBorder)}
            >
              <Text fontSize="11px" color={labelColor} noOfLines={1}>
                {lbl}
              </Text>
              <Text
                fontSize="12px"
                fontWeight={600}
                color={valueColor}
                fontFamily="mono"
                flexShrink={0}
              >
                {val}
              </Text>
            </Flex>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

/** /notifications — recent irrigation-summary notifications. */
export const NotificationsCard = ({
  notifications = MOCK_NOTIFICATIONS.notifications,
}: {
  notifications?: NotificationRow[];
}) => {
  const t = useTranslations();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const msgColor = useColorModeValue('gray.600', 'gray.300');
  const dateColor = useColorModeValue('gray.400', 'gray.500');
  const emptyColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t('misc.chatbot.notificationsCard.title')}
      </Text>
      {notifications.length === 0 ? (
        <Text fontSize="12px" color={emptyColor}>
          {t('misc.chatbot.notificationsCard.empty')}
        </Text>
      ) : (
        notifications.map((n) => (
          <Box key={n.id} {...rowStyle(cardBg, cardBorder)}>
            <Flex justify="space-between" align="baseline" gap="8px">
              <Text
                fontSize="12.5px"
                fontWeight={600}
                color={titleColor}
                noOfLines={1}
              >
                {n.title}
              </Text>
              {n.date && (
                <Text
                  fontSize="10px"
                  color={dateColor}
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {new Date(n.date).toLocaleDateString()}
                </Text>
              )}
            </Flex>
            {n.message && (
              <Text fontSize="11px" color={msgColor} mt="2px">
                {n.message}
              </Text>
            )}
          </Box>
        ))
      )}
    </Box>
  );
};
