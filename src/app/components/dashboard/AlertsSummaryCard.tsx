'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Tag,
  Text,
  VStack,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { alertApi, type AlertRecord } from '@/app/lib/alertApi';
import DashboardCard from '@component/dashboard/DashboardCard';
import Loading from '@component/common/Loading';

const MAX_ROWS = 5;

const localeTag = (locale: string): string =>
  locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';

const AlertsSummaryCard = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tableBg = useColorModeValue('white', 'gray.800');
  const itemBg = useColorModeValue('gray.50', 'gray.700');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const metaColor = useColorModeValue('gray.500', 'gray.400');
  const linkColor = useColorModeValue('brand.600', 'brand.300');
  const p = useBreakpointValue({ base: 2, md: 4 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await alertApi.list();
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = alerts.filter((a) => a.is_active).length;
  const triggered = [...alerts]
    .filter((a) => a.last_triggered_at)
    .sort(
      (a, b) =>
        Date.parse(b.last_triggered_at as string) -
        Date.parse(a.last_triggered_at as string)
    )
    .slice(0, MAX_ROWS);

  const content = loading ? (
    <Loading />
  ) : error ? (
    <VStack spacing={2} align="start" py={4}>
      <Text fontSize="sm" color={metaColor}>
        {t('shell.dashboard.loadError')}
      </Text>
      <Button size="xs" variant="outline" onClick={() => void load()}>
        {t('shell.dashboard.retry')}
      </Button>
    </VStack>
  ) : alerts.length === 0 ? (
    <Text fontSize="sm" color={metaColor} py={4}>
      {t('shell.dashboard.alertsNoConfig')}
    </Text>
  ) : (
    <VStack spacing={3} align="stretch">
      <HStack>
        <Badge colorScheme="green" borderRadius="full" px={2}>
          {t('shell.dashboard.alertsActive', {
            active: activeCount,
            total: alerts.length,
          })}
        </Badge>
        {triggered.length > 0 && (
          <Badge colorScheme="red" borderRadius="full" px={2}>
            {triggered.length}
          </Badge>
        )}
      </HStack>

      <Box>
        <Text fontSize="xs" color={metaColor} mb={1} fontWeight="medium">
          {t('shell.dashboard.alertsRecentlyTriggered')}
        </Text>
        {triggered.length === 0 ? (
          <Text fontSize="sm" color={metaColor}>
            {t('shell.dashboard.alertsNoRecent')}
          </Text>
        ) : (
          <VStack spacing={2} align="stretch">
            {triggered.map((a) => (
              <Box
                key={a.id}
                bg={itemBg}
                borderRadius="md"
                px={3}
                py={2}
                cursor="pointer"
                _hover={{ opacity: 0.85 }}
                onClick={() => router.push('/alerts')}
              >
                <HStack align="start" spacing={2}>
                  <WarningTwoIcon color="red.400" mt={1} />
                  <Box minW={0} flex={1}>
                    <HStack justify="space-between" align="start">
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color={titleColor}
                        noOfLines={1}
                      >
                        {a.name}
                      </Text>
                      {!a.is_active && (
                        <Tag size="sm" colorScheme="gray" flexShrink={0}>
                          {t('alertsPage.main.no')}
                        </Tag>
                      )}
                    </HStack>
                    <Text fontSize="xs" color={metaColor}>
                      {new Date(
                        a.last_triggered_at as string
                      ).toLocaleString(localeTag(locale), {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );

  return (
    <Box
      width="100%"
      height="100%"
      bg={tableBg}
      borderRadius="md"
      p={p}
      overflowX="auto"
    >
      <DashboardCard
        title={t('shell.dashboard.alertsSummary')}
        titleAddon={
          <Flex
            as="button"
            align="center"
            color={linkColor}
            fontSize="sm"
            fontWeight="medium"
            onClick={() => router.push('/alerts')}
          >
            {t('shell.dashboard.viewAll')}
          </Flex>
        }
        content={content}
      />
    </Box>
  );
};

export default AlertsSummaryCard;
