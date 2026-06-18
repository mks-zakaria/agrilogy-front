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
  MOCK_WEATHER,
  MOCK_ZONES,
  type AlertRow,
  type MetricRow,
  type Severity,
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

/** /status — snapshot of key metrics (from the get_farm_status tool). */
export const FarmStatusCard = ({
  metrics = MOCK_FARM_STATUS.metrics,
}: {
  metrics?: MetricRow[];
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
        {t('misc.chatbot.statusCard.title')}
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
