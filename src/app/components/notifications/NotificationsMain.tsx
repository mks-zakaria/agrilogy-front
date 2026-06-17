'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  HStack,
  Select,
  Text,
  VStack,
  Wrap,
  WrapItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, BellIcon } from '@chakra-ui/icons';
import Notification from '../notifications/Notification';
import axiosInstance from '@/app/lib/api';
import {
  markAllNotificationsReadInCache,
  mergeNotificationsForStorage,
  normalizeApiNotificationsList,
  NOTIFICATIONS_CACHE_UPDATED_EVENT,
  notificationRowZoneId,
  readNotificationsFromCache,
  writeNotificationsToCache,
} from '@/app/lib/notificationsCacheStorage';
import { decisionLevelForNotification } from '@/app/lib/notificationDecisionLevel';
import type { NotificationDecisionLevel } from '@/app/lib/notificationDecisionEngine';
import EmptyBox from '../common/EmptyBox';
import useColorModeStyles from '@/app/utils/useColorModeStyles';
import { useTranslations } from 'next-intl';
import { useNotificationBellCounts } from '@/app/hooks/useNotificationBellCounts';
import ZoneNotificationConfigureForm from '@/app/components/notifications/ZoneNotificationConfigureForm';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  deleteNotificationConfigById,
  getNotificationConfigById,
  getNotificationConfigsForZone,
  resolveStoredNotificationConfigId,
} from '@/app/lib/zoneNotificationConfigStorage';

const NotificationsMain: React.FC = () => {
  const t = useTranslations();
  const toast = useToast();
  const { navBgColor } = useColorModeStyles();
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { refresh: refreshBell } = useNotificationBellCounts();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [configureInitialZoneId, setConfigureInitialZoneId] = useState<
    number | undefined
  >(undefined);
  const [configureConfigId, setConfigureConfigId] = useState<
    string | undefined
  >(undefined);
  const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);
  const [configureIntent, setConfigureIntent] = useState<'create' | 'edit'>(
    'create'
  );
  const searchParams = useSearchParams();
  const router = useRouter();

  const stripConfigureParamsFromUrl = () => {
    if (searchParams.get('zoneId') || searchParams.get('configId')) {
      router.replace('/notifications', { scroll: false });
    }
  };

  const closeConfigureModal = () => {
    setConfigureIntent('create');
    setConfigureInitialZoneId(undefined);
    setConfigureConfigId(undefined);
    stripConfigureParamsFromUrl();
    onClose();
  };

  const refetchNotifications = () => {
    void axiosInstance
      .get('/notifications')
      .then((r) => {
        const apiRows = normalizeApiNotificationsList(r.data?.notifications);
        const merged = mergeNotificationsForStorage(apiRows);
        setNotifications(merged as any[]);
        writeNotificationsToCache(merged);
      })
      .catch(() => {
        setNotifications(readNotificationsFromCache() as any[]);
      });
  };

  const syncNotificationsFromCache = () => {
    setNotifications(readNotificationsFromCache() as any[]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/notifications');
        const apiRows = normalizeApiNotificationsList(
          response.data?.notifications
        );
        const merged = mergeNotificationsForStorage(apiRows);
        setNotifications(merged as any[]);
        writeNotificationsToCache(merged);
      } catch {
        setNotifications(readNotificationsFromCache() as any[]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const syncFromCache = () => {
      setNotifications(readNotificationsFromCache() as any[]);
    };
    window.addEventListener(NOTIFICATIONS_CACHE_UPDATED_EVENT, syncFromCache);
    return () =>
      window.removeEventListener(
        NOTIFICATIONS_CACHE_UPDATED_EVENT,
        syncFromCache
      );
  }, []);

  useEffect(() => {
    if (
      isOpen &&
      configureIntent === 'edit' &&
      !configureConfigId &&
      configureInitialZoneId != null
    ) {
      const list = getNotificationConfigsForZone(configureInitialZoneId);
      if (list.length === 1) {
        setConfigureConfigId(list[0].configId);
      }
    }
  }, [isOpen, configureIntent, configureConfigId, configureInitialZoneId]);

  useEffect(() => {
    const cid = searchParams.get('configId')?.trim();
    const z = searchParams.get('zoneId');
    if (cid) {
      setConfigureIntent('edit');
      setConfigureConfigId(cid);
      const cfg = getNotificationConfigById(cid);
      setConfigureInitialZoneId(cfg?.zoneId);
      onOpen();
      return;
    }
    if (!z) return;
    const id = Number(z);
    if (!Number.isFinite(id)) return;
    const list = getNotificationConfigsForZone(id);
    if (list.length === 1) {
      setConfigureIntent('edit');
      setConfigureConfigId(list[0].configId);
      setConfigureInitialZoneId(id);
    } else {
      setConfigureIntent('create');
      setConfigureConfigId(undefined);
      setConfigureInitialZoneId(id);
    }
    onOpen();
  }, [searchParams, onOpen]);

  const openConfigure = () => {
    setConfigureIntent('create');
    setConfigureInitialZoneId(undefined);
    setConfigureConfigId(undefined);
    stripConfigureParamsFromUrl();
    onOpen();
  };

  const openEditZone = (zoneId: number, configId?: string) => {
    if (configId?.trim()) {
      setConfigureIntent('edit');
      setConfigureConfigId(configId.trim());
      setConfigureInitialZoneId(zoneId);
      onOpen();
      return;
    }
    const list = getNotificationConfigsForZone(zoneId);
    if (list.length === 1) {
      setConfigureIntent('edit');
      setConfigureConfigId(list[0].configId);
      setConfigureInitialZoneId(zoneId);
      onOpen();
      return;
    }
    setConfigureIntent('create');
    setConfigureConfigId(undefined);
    setConfigureInitialZoneId(zoneId);
    onOpen();
  };

  const confirmDeleteNotificationConfig = () => {
    if (deleteConfigId == null) return;
    const id = deleteConfigId;
    setDeleteConfigId(null);
    deleteNotificationConfigById(id);
    setNotifications(readNotificationsFromCache() as any[]);
    void refreshBell();
    toast({
      title: t('notifications.main.deletedToastTitle'),
      description: t('notifications.main.deletedToastDescription'),
      status: 'success',
      duration: 4000,
      isClosable: true,
    });
  };

  // ---- read/unread + filters ---------------------------------------------
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | NotificationDecisionLevel>(
    'all'
  );
  const [zoneFilter, setZoneFilter] = useState<'all' | number>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n?.is_read).length,
    [notifications]
  );

  const zonesPresent = useMemo(() => {
    const m = new Map<number, string>();
    for (const n of notifications) {
      const zid = notificationRowZoneId(n);
      if (zid != null && !m.has(zid)) m.set(zid, n.zone_name || `#${zid}`);
    }
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (statusFilter === 'unread' && n?.is_read) return false;
      const zid = notificationRowZoneId(n);
      if (zoneFilter !== 'all' && zid !== zoneFilter) return false;
      if (levelFilter !== 'all') {
        const lvl = decisionLevelForNotification({
          et0: String(n?.notification?.ET0 ?? ''),
          soilHumidity: String(n?.notification?.soil_humidity ?? ''),
          configId: resolveStoredNotificationConfigId(n),
          zoneId: zid,
          notificationName: n?.notification?.notification_name,
          isTemplateSummary: Boolean(n?.notification?.template_summary),
        });
        if (lvl !== levelFilter) return false;
      }
      return true;
    });
  }, [notifications, statusFilter, zoneFilter, levelFilter]);

  const handleMarkAllRead = () => {
    markAllNotificationsReadInCache();
    setNotifications(readNotificationsFromCache() as any[]);
    void refreshBell();
  };

  const levelChips: Array<{
    value: 'all' | NotificationDecisionLevel;
    label: string;
    scheme: string;
  }> = [
    { value: 'all', label: t('notifications.filters.allLevels'), scheme: 'brand' },
    { value: 'critical', label: t('notifications.card.tagCritical'), scheme: 'red' },
    {
      value: 'advisory',
      label: t('notifications.card.tagAdvisory'),
      scheme: 'orange',
    },
    { value: 'ok', label: t('notifications.card.tagOk'), scheme: 'green' },
  ];

  if (loading) return <EmptyBox variant="loading" />;

  return (
    <Box px={{ base: 3, md: 4 }} pb={{ base: 3, md: 4 }}>
      {/* Fixed top panel: pinned to the scroll container top so only the
          notification list scrolls beneath it. Full-bleed background hides
          cards as they pass under. */}
      <Box
        position="sticky"
        top={0}
        zIndex={3}
        bg={navBgColor}
        mx={{ base: -3, md: -4 }}
        px={{ base: 3, md: 4 }}
        pt={{ base: 3, md: 4 }}
        pb={{ base: 3, md: 4 }}
        sx={{ '& > [role="region"]': { marginBottom: 0 } }}
      >
        <PageInfoBar
          title={t('notifications.main.title')}
          subtitle={t('notifications.main.subtitle')}
          actions={
            <Button
              colorScheme="brand"
              leftIcon={<AddIcon />}
              size="sm"
              onClick={openConfigure}
              data-testid="add-zone-notif"
            >
              {t('notifications.main.addZoneNotification')}
            </Button>
          }
        />

        {notifications.length > 0 && (
          <Box maxW="820px" mx="auto" w="full" mt={3}>
            <Wrap spacing={2} align="center">
              <WrapItem>
                <HStack spacing={1}>
                  {(['all', 'unread'] as const).map((s) => (
                    <Button
                      key={s}
                      size="xs"
                      borderRadius="full"
                      variant={statusFilter === s ? 'solid' : 'outline'}
                      colorScheme={statusFilter === s ? 'brand' : 'gray'}
                      onClick={() => setStatusFilter(s)}
                      aria-pressed={statusFilter === s}
                    >
                      {s === 'all'
                        ? t('notifications.filters.allStatus')
                        : `${t('notifications.filters.unread')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                    </Button>
                  ))}
                </HStack>
              </WrapItem>
              <WrapItem>
                <HStack spacing={1}>
                  {levelChips.map((c) => (
                    <Button
                      key={c.value}
                      size="xs"
                      borderRadius="full"
                      variant={levelFilter === c.value ? 'solid' : 'outline'}
                      colorScheme={levelFilter === c.value ? c.scheme : 'gray'}
                      onClick={() => setLevelFilter(c.value)}
                      aria-pressed={levelFilter === c.value}
                    >
                      {c.label}
                    </Button>
                  ))}
                </HStack>
              </WrapItem>
              {zonesPresent.length > 1 && (
                <WrapItem>
                  <Select
                    size="xs"
                    borderRadius="md"
                    maxW="200px"
                    value={String(zoneFilter)}
                    onChange={(e) =>
                      setZoneFilter(
                        e.target.value === 'all'
                          ? 'all'
                          : Number(e.target.value)
                      )
                    }
                    aria-label={t('notifications.filters.allZones')}
                  >
                    <option value="all">
                      {t('notifications.filters.allZones')}
                    </option>
                    {zonesPresent.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </Select>
                </WrapItem>
              )}
              {unreadCount > 0 && (
                <WrapItem>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="brand"
                    onClick={handleMarkAllRead}
                  >
                    {t('notifications.filters.markAllRead')}
                  </Button>
                </WrapItem>
              )}
            </Wrap>
          </Box>
        )}
      </Box>

      {notifications.length === 0 ? (
        <Box maxW="820px" mx="auto" w="full" mt={6}>
          <EmptyBox variant="empty" />
        </Box>
      ) : filtered.length === 0 ? (
        <Box maxW="820px" mx="auto" w="full" mt={6} textAlign="center">
          <Text fontSize="sm" color="gray.500">
            {t('notifications.filters.noResults')}
          </Text>
        </Box>
      ) : (
        <VStack
          spacing={{ base: 3, md: 4 }}
          align="stretch"
          maxW="820px"
          mx="auto"
          w="full"
          mt={{ base: 3, md: 4 }}
        >
          {filtered.map((notification) => {
            const zid = notificationRowZoneId(notification);
            const rowCfgId = resolveStoredNotificationConfigId(notification);
            return (
              <Notification
                key={notification.id}
                id={notification.id}
                notification={{
                  ...notification.notification,
                  zone_id: zid,
                  zone_name: notification.zone_name,
                  notification_config_id: rowCfgId,
                  notification_name:
                    notification.notification?.notification_name,
                }}
                is_read={notification.is_read}
                read_at={notification.read_at}
                onEditZone={
                  zid != null ? () => openEditZone(zid, rowCfgId) : undefined
                }
                onDeleteZone={
                  zid != null && rowCfgId
                    ? () => setDeleteConfigId(rowCfgId)
                    : undefined
                }
              />
            );
          })}
        </VStack>
      )}

      <Modal
        isOpen={isOpen}
        onClose={closeConfigureModal}
        size="6xl"
        scrollBehavior="inside"
        blockScrollOnMount={false}
      >
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <ModalContent
          borderRadius="xl"
          mx={{ base: 2, md: 4 }}
          maxW="min(1200px, 100vw - 16px)"
        >
          <ModalHeader
            display="flex"
            alignItems="center"
            gap={2}
            fontSize="lg"
            pb={1}
          >
            <BellIcon color="primary.400" />
            {configureIntent === 'edit'
              ? t('notifications.main.editModalTitle')
              : t('notifications.main.newModalTitle')}
          </ModalHeader>
          <ModalCloseButton borderRadius="full" onClick={closeConfigureModal} />
          <ModalBody pb={6}>
            {isOpen && (
              <ZoneNotificationConfigureForm
                key={`${configureIntent}-${configureInitialZoneId ?? 'z'}-${configureConfigId ?? 'new'}`}
                intent={configureIntent}
                initialZoneId={configureInitialZoneId ?? null}
                initialConfigId={configureConfigId ?? null}
                onClose={closeConfigureModal}
                onSaved={() => {
                  syncNotificationsFromCache();
                  void refreshBell();
                  refetchNotifications();
                }}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteConfigId != null}
        leastDestructiveRef={deleteCancelRef}
        onClose={() => setDeleteConfigId(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('notifications.main.deleteDialogTitle')}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t('notifications.main.deleteDialogBody')}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={deleteCancelRef}
                onClick={() => setDeleteConfigId(null)}
              >
                {t('notifications.main.cancel')}
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteNotificationConfig}
                ml={3}
              >
                {t('notifications.main.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default NotificationsMain;
