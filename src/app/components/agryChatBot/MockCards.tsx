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
  type Severity,
} from './mockData';
import { useChat } from './ChatContext';

function useSeverityColor() {
  const critical = useColorModeValue('red.500', 'red.300');
  const warning = useColorModeValue('orange.500', 'orange.300');
  const ok = useColorModeValue('green.500', 'green.300');
  return (s: Severity) =>
    s === 'critical' ? critical : s === 'warning' ? warning : ok;
}

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

/** /alerts — sample active alerts. */
export const AlertsCard = () => {
  const t = useTranslations();
  const sevColor = useSeverityColor();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const nameColor = useColorModeValue('gray.800', 'gray.100');
  const metaColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t('misc.chatbot.alertsCard.title')}
      </Text>
      {MOCK_ALERTS.map((a) => (
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
            <Text fontSize="12.5px" fontWeight={600} color={nameColor}>
              {t(`misc.chatbot.data.sensor.${a.sensorKey}`)}
            </Text>
            <Text fontSize="11px" color={metaColor}>
              {a.zone}
            </Text>
          </Box>
          <Text
            fontSize="12.5px"
            fontWeight={700}
            color={sevColor(a.severity)}
            fontFamily="mono"
          >
            {a.value}
          </Text>
        </Flex>
      ))}
    </Box>
  );
};

/** /status — a snapshot of key metrics. */
export const FarmStatusCard = () => {
  const t = useTranslations();
  const sevColor = useSeverityColor();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t('misc.chatbot.statusCard.title')}
      </Text>
      <SimpleGrid columns={2} spacing="6px">
        {MOCK_FARM_STATUS.map((m) => (
          <Box key={m.key} {...rowStyle(cardBg, cardBorder)}>
            <Text fontSize="10.5px" color={labelColor} noOfLines={1}>
              {t(`misc.chatbot.data.sensor.${m.key}`)}
            </Text>
            <Text
              fontSize="14px"
              fontWeight={700}
              color={sevColor(m.status)}
              fontFamily="mono"
            >
              {m.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

/** /weather — current conditions. */
export const WeatherCard = () => {
  const t = useTranslations();
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'gray.100');

  const rows: { label: string; value: string }[] = [
    {
      label: t('misc.chatbot.data.weather.condition'),
      value: t(`misc.chatbot.data.weather.${MOCK_WEATHER.conditionKey}`),
    },
    { label: t('misc.chatbot.data.sensor.airTemp'), value: MOCK_WEATHER.tempC },
    {
      label: t('misc.chatbot.data.sensor.humidity'),
      value: MOCK_WEATHER.humidity,
    },
    { label: t('misc.chatbot.data.weather.wind'), value: MOCK_WEATHER.wind },
    { label: t('misc.chatbot.data.sensor.et0'), value: MOCK_WEATHER.et0 },
  ];

  return (
    <Box display="flex" flexDirection="column" gap="6px" w="100%">
      <Text fontSize="13px" fontWeight={600} mb="2px">
        {t('misc.chatbot.weatherCard.title')}
      </Text>
      {rows.map((r) => (
        <Flex
          key={r.label}
          justify="space-between"
          align="center"
          {...rowStyle(cardBg, cardBorder)}
        >
          <Text fontSize="12px" color={labelColor}>
            {r.label}
          </Text>
          <Text
            fontSize="12.5px"
            fontWeight={600}
            color={valueColor}
            fontFamily="mono"
          >
            {r.value}
          </Text>
        </Flex>
      ))}
    </Box>
  );
};
