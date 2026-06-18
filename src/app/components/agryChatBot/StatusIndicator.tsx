'use client';
import { useEffect, useState } from 'react';
import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useTranslations } from 'next-intl';

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%           { transform: translateY(-4px); opacity: 1; }
`;

/**
 * Live "what the assistant is doing" line shown while a reply is in flight.
 * Cycles a set of activity words (one per tool/endpoint it might be calling —
 * sensors, alerts, weather, …) so the wait reads as work, not a hang.
 */
const STATUS_KEYS = [
  'thinking',
  'sensors',
  'alerts',
  'weather',
  'sitemap',
  'analyzing',
];

export const StatusIndicator = () => {
  const t = useTranslations();
  const [i, setI] = useState(0);
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const dotColor = useColorModeValue('gray.400', 'gray.500');

  useEffect(() => {
    const id = setInterval(
      () => setI((v) => (v + 1) % STATUS_KEYS.length),
      1400
    );
    return () => clearInterval(id);
  }, []);

  return (
    <Flex align="center" gap="8px" py="2px">
      <Box display="flex" alignItems="center" gap="4px">
        {[0, 0.2, 0.4].map((delay, idx) => (
          <Box
            key={idx}
            as="span"
            display="block"
            w="5px"
            h="5px"
            borderRadius="50%"
            bg={dotColor}
            animation={`${bounce} 1.2s ease-in-out ${delay}s infinite`}
          />
        ))}
      </Box>
      <Text fontSize="12px" color={textColor} fontStyle="italic">
        {t(`misc.chatbot.status.${STATUS_KEYS[i]}`)}
      </Text>
    </Flex>
  );
};
