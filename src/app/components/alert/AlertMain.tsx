'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import {
  App,
  Button,
  Empty,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useLocale, useTranslations } from 'next-intl';
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  MailOutlined,
  MessageOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import { alertApi, type AlertRecord } from '@/app/lib/alertApi';
import {
  ALERT_CHOICES,
  CONDITION_CHOICES,
  DEFAULT_SENSOR_KEYS,
  type SensorKeyOption,
} from '@/app/utils/alertChoices';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  MobileRecordCards,
  type RecordCard,
} from '@/app/components/common/MobileRecordCards';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import AlertCreateDrawer from './AlertCreateDrawer';
import styles from './AlertMain.module.scss';

const ALERT_LIMIT = 10;

const localeTag = (locale: string): string =>
  locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';

const AlertMain: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const { message } = App.useApp();
  const isMobile = useIsMobile();

  const formatTriggered = (iso: string | null): string =>
    iso
      ? new Date(iso).toLocaleString(localeTag(locale), {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : t('alertsPage.main.neverTriggered');

  // Email is the base channel (defaults on); SMS/WhatsApp show only when
  // explicitly enabled. Tolerant of a backend that omits the flags.
  const renderChannels = (row: AlertRecord) => (
    <Space size={8}>
      {row.notify_email !== false && (
        <Tooltip title={t('alertsPage.main.channelEmail')}>
          <MailOutlined
            role="img"
            aria-label={t('alertsPage.main.channelEmail')}
          />
        </Tooltip>
      )}
      {row.notify_sms && (
        <Tooltip title={t('alertsPage.main.channelSms')}>
          <MessageOutlined
            role="img"
            aria-label={t('alertsPage.main.channelSms')}
          />
        </Tooltip>
      )}
      {row.notify_whatsapp && (
        <Tooltip title={t('alertsPage.main.channelWhatsapp')}>
          <WhatsAppOutlined
            role="img"
            aria-label={t('alertsPage.main.channelWhatsapp')}
            style={{ color: '#25D366' }}
          />
        </Tooltip>
      )}
    </Space>
  );

  const conditionLabel = (c: string) => {
    const choice = CONDITION_CHOICES.find((cc) => cc.value === c);
    return choice ? t(`conditions.${choice.i18nKey}`) : c;
  };

  const typeLabel = (type: string) => {
    const choice = ALERT_CHOICES.find((c) => c.value === type);
    return choice ? t(`alertTypes.${choice.i18nKey}`) : type;
  };
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sensorKeys, setSensorKeys] =
    useState<SensorKeyOption[]>(DEFAULT_SENSOR_KEYS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AlertRecord | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alertApi.list();
      setAlerts(data);
    } catch {
      message.error(t('alertsPage.main.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    void alertApi
      .sensorKeys()
      .then((keys) => {
        if (Array.isArray(keys) && keys.length > 0) {
          setSensorKeys(
            keys.map((k) => ({ key: k.key, label: k.label, unit: k.unit }))
          );
        }
      })
      .catch(() => {
        /* keep DEFAULT_SENSOR_KEYS */
      });
  }, []);

  const openCreate = () => {
    if (alerts.length >= ALERT_LIMIT) {
      message.warning(t('alertsPage.main.limitReached', { max: ALERT_LIMIT }));
      return;
    }
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (alert: AlertRecord) => {
    setEditing(alert);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await alertApi.remove(id);
      message.success(t('alertsPage.main.deleteSuccess'));
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      message.error(t('alertsPage.main.deleteError'));
    }
  };

  const handleToggleActive = async (alert: AlertRecord) => {
    try {
      const updated = await alertApi.update(alert.id, {
        is_active: !alert.is_active,
      });
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch {
      message.error(t('alertsPage.main.toggleError'));
    }
  };

  const columns: ColumnsType<AlertRecord> = useMemo(
    () => [
      {
        title: t('alertsPage.main.columnName'),
        dataIndex: 'name',
        key: 'name',
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text: string, row) => (
          <Space size={8}>
            <strong>{text}</strong>
            {row.last_triggered_at && (
              <Tag color="red" className={styles.triggeredTag}>
                {t('alertsPage.main.recentlyTriggered')}
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: t('alertsPage.main.columnSensor'),
        dataIndex: 'sensor_key',
        key: 'sensor_key',
        render: (key: string) =>
          key && t.has(`sensors.${key}`)
            ? t(`sensors.${key}`)
            : (sensorKeys.find((s) => s.key === key)?.label ?? key ?? '—'),
      },
      {
        title: t('alertsPage.main.columnCategory'),
        dataIndex: 'type',
        key: 'type',
        filters: Array.from(new Set(alerts.map((a) => a.type))).map((type) => ({
          text: typeLabel(type),
          value: type,
        })),
        onFilter: (value, row) => row.type === value,
        render: (type: string) => <Tag>{typeLabel(type)}</Tag>,
      },
      {
        title: t('alertsPage.main.columnCondition'),
        key: 'condition',
        render: (_, row) => (
          <span>
            {conditionLabel(row.condition)}{' '}
            <strong>{row.threshold ?? row.condition_nbr}</strong>{' '}
            <span className={styles.thresholdHint}>
              {sensorKeys.find((s) => s.key === row.sensor_key)?.unit ?? ''}
            </span>
          </span>
        ),
      },
      {
        title: t('alertsPage.main.columnChannels'),
        key: 'channels',
        render: (_, row) => renderChannels(row),
      },
      {
        title: t('alertsPage.main.columnLastTriggered'),
        dataIndex: 'last_triggered_at',
        key: 'last_triggered_at',
        sorter: (a, b) =>
          (a.last_triggered_at ? Date.parse(a.last_triggered_at) : 0) -
          (b.last_triggered_at ? Date.parse(b.last_triggered_at) : 0),
        render: (iso: string | null) => (
          <span className={iso ? undefined : styles.thresholdHint}>
            {formatTriggered(iso)}
          </span>
        ),
      },
      {
        title: t('alertsPage.main.columnActive'),
        dataIndex: 'is_active',
        key: 'is_active',
        filters: [
          { text: t('alertsPage.main.yes'), value: true },
          { text: t('alertsPage.main.no'), value: false },
        ],
        onFilter: (value, row) => row.is_active === value,
        render: (on: boolean, row) => (
          <Tooltip
            title={
              on
                ? t('alertsPage.main.deactivate')
                : t('alertsPage.main.activate')
            }
          >
            <Switch
              size="small"
              checked={on}
              onChange={() => handleToggleActive(row)}
              aria-label={
                on
                  ? t('alertsPage.main.deactivate')
                  : t('alertsPage.main.activate')
              }
            />
          </Tooltip>
        ),
      },
      {
        title: t('alertsPage.main.columnActions'),
        key: 'actions',
        align: 'right',
        render: (_, row) => (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => openEdit(row)}
              aria-label={t('alertsPage.main.editAria', { name: row.name })}
            >
              {t('alertsPage.main.edit')}
            </Button>
            <Popconfirm
              title={t('alertsPage.main.deleteConfirm')}
              okText={t('alertsPage.main.delete')}
              cancelText={t('alertsPage.main.cancel')}
              onConfirm={() => handleDelete(row.id)}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                aria-label={t('alertsPage.main.deleteAria', { name: row.name })}
              >
                {t('alertsPage.main.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sensorKeys, t, alerts, locale]
  );

  const sensorLabel = useCallback(
    (key: string) =>
      key && t.has(`sensors.${key}`)
        ? t(`sensors.${key}`)
        : (sensorKeys.find((s) => s.key === key)?.label ?? key ?? '—'),
    [sensorKeys, t]
  );

  const mobileCards: RecordCard[] = useMemo(
    () =>
      alerts.map((row) => ({
        key: row.id,
        title: (
          <Space size={8} wrap>
            <span>{row.name}</span>
            {row.last_triggered_at && (
              <Tag color="red" className={styles.triggeredTag}>
                {t('alertsPage.main.recentlyTriggered')}
              </Tag>
            )}
          </Space>
        ),
        fields: [
          {
            label: t('alertsPage.main.columnSensor'),
            value: sensorLabel(row.sensor_key),
          },
          {
            label: t('alertsPage.main.columnCategory'),
            value: <Tag>{typeLabel(row.type)}</Tag>,
          },
          {
            label: t('alertsPage.main.columnCondition'),
            value: (
              <span>
                {conditionLabel(row.condition)}{' '}
                <strong>{row.threshold ?? row.condition_nbr}</strong>{' '}
                {sensorKeys.find((s) => s.key === row.sensor_key)?.unit ?? ''}
              </span>
            ),
          },
          {
            label: t('alertsPage.main.columnChannels'),
            value: renderChannels(row),
          },
          {
            label: t('alertsPage.main.columnLastTriggered'),
            value: formatTriggered(row.last_triggered_at),
          },
          {
            label: t('alertsPage.main.columnActive'),
            value: (
              <Switch
                size="small"
                checked={row.is_active}
                onChange={() => handleToggleActive(row)}
                aria-label={
                  row.is_active
                    ? t('alertsPage.main.deactivate')
                    : t('alertsPage.main.activate')
                }
              />
            ),
          },
        ],
        footer: (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(row)}
              aria-label={t('alertsPage.main.editAria', { name: row.name })}
            >
              {t('alertsPage.main.edit')}
            </Button>
            <Popconfirm
              title={t('alertsPage.main.deleteConfirm')}
              okText={t('alertsPage.main.delete')}
              cancelText={t('alertsPage.main.cancel')}
              onConfirm={() => handleDelete(row.id)}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label={t('alertsPage.main.deleteAria', { name: row.name })}
              >
                {t('alertsPage.main.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alerts, sensorKeys, t, sensorLabel, locale]
  );

  return (
    <Box
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 4 }}
      data-testid="alert-main"
    >
      <PageInfoBar
        title={t('alertsPage.main.pageTitle')}
        subtitle={t('alertsPage.main.pageSubtitle')}
        actions={
          <Space size={10}>
            <Tag color={alerts.length >= ALERT_LIMIT ? 'orange' : 'default'}>
              {alerts.length}/{ALERT_LIMIT}
            </Tag>
            <Tooltip
              title={
                alerts.length >= ALERT_LIMIT
                  ? t('alertsPage.main.atLimitTooltip', { max: ALERT_LIMIT })
                  : undefined
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreate}
                disabled={alerts.length >= ALERT_LIMIT}
                data-testid="alert-create-button"
              >
                {t('alertsPage.main.newAlert')}
              </Button>
            </Tooltip>
          </Space>
        }
      />

      <Box
        bg="app.surface"
        borderWidth="1px"
        borderColor="app.border"
        borderRadius="lg"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
        minW={0}
      >
        {isMobile && !loading && alerts.length > 0 ? (
          <MobileRecordCards cards={mobileCards} />
        ) : (
          <Table<AlertRecord>
            rowKey="id"
            columns={columns}
            dataSource={alerts}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('alertsPage.main.emptyText')}
                />
              ),
            }}
          />
        )}
      </Box>

      <AlertCreateDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editing}
        onSaved={() => {
          closeDrawer();
          void fetchAlerts();
        }}
      />
    </Box>
  );
};

export default AlertMain;
