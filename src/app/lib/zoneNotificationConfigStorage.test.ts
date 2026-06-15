/**
 * All-cases tests for zone notification config persistence — the backbone that
 * stores every field of the "create notification" popup (soil params, valve,
 * VPD, channels, delivery rate). Covers round-trip, multi-sector, delete,
 * throttle state, threshold mapping, and legacy migration.
 */
import {
  ZONE_NOTIFICATION_CONFIG_UPDATED_EVENT,
  deleteAllNotificationConfigsForZone,
  deleteNotificationConfigById,
  findNotificationConfigForZoneRow,
  getAllZoneNotificationConfigs,
  getNotificationConfigById,
  getNotificationConfigsForZone,
  hasZoneNotificationConfig,
  recordZoneNotificationSent,
  representativeKcFromStages,
  saveZoneNotificationConfig,
  thresholdsFromConfig,
  type ZoneNotificationConfig,
} from './zoneNotificationConfigStorage';

const STORAGE_KEY = 'agrilogy_zone_notification_configs_v1';

function makeConfig(
  over: Partial<ZoneNotificationConfig> = {}
): ZoneNotificationConfig {
  return {
    configId: 'cfg-1',
    zoneId: 1,
    secteurLabel: 'Secteur nord',
    notificationName: 'Zone 1 tomates',
    soilType: 'light',
    soilTawMm: 120,
    soilRawMm: 60,
    soilFcPct: 30,
    soilWpPct: 12,
    kcMode: 'manual',
    kc: 0.85,
    kcProtocolName: 'Protocole',
    kcStages: [
      {
        stageName: 'Avril',
        durationDays: 30,
        kcStart: 0.4,
        kcEnd: 0.8,
        amountMm: 15,
        active: true,
      },
    ],
    et0Source: 'weather_station',
    precipSource: 'sensor',
    krFactor: 0.4,
    zoneAreaHa: 5,
    cropType: 'Tomates',
    flowRateM3h: 30,
    irrigationMethod: 'drip',
    intervalMinutes: 60,
    deliveryRate: { amount: 1, unit: 'hour' },
    lastNotifiedAt: null,
    soilPermeabilityPct: 75,
    valveMode: 'manual',
    criticalThresholdPct: 20,
    et0KcAdvisoryMm: 4,
    maxWaterM3: 50,
    notifyEmail: true,
    notifySms: false,
    notifyWhatsapp: false,
    overridePhone: '',
    overrideEmail: '',
    updatedAt: '',
    ...over,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('empty store', () => {
  it('returns nothing', () => {
    expect(getAllZoneNotificationConfigs()).toEqual([]);
    expect(getNotificationConfigsForZone(1)).toEqual([]);
    expect(getNotificationConfigById('nope')).toBeUndefined();
    expect(hasZoneNotificationConfig(1)).toBe(false);
  });
});

describe('save / load round-trip', () => {
  it('persists all fields and stamps updatedAt', () => {
    saveZoneNotificationConfig(makeConfig());
    const got = getNotificationConfigById('cfg-1');
    expect(got).toBeDefined();
    expect(got?.soilTawMm).toBe(120);
    expect(got?.soilRawMm).toBe(60);
    expect(got?.soilFcPct).toBe(30);
    expect(got?.soilWpPct).toBe(12);
    expect(got?.irrigationMethod).toBe('drip');
    expect(got?.valveMode).toBe('manual');
    expect(got?.maxWaterM3).toBe(50);
    expect(got?.updatedAt).not.toBe('');
  });

  it('trims the configId and keys the map by it', () => {
    saveZoneNotificationConfig(makeConfig({ configId: '  cfg-x  ' }));
    expect(getNotificationConfigById('cfg-x')).toBeDefined();
  });

  it('throws when configId is missing/blank', () => {
    expect(() =>
      saveZoneNotificationConfig(makeConfig({ configId: '' }))
    ).toThrow();
    expect(() =>
      saveZoneNotificationConfig(makeConfig({ configId: '   ' }))
    ).toThrow();
  });

  it('persists per-channel contact overrides', () => {
    saveZoneNotificationConfig(
      makeConfig({
        notifyEmail: true,
        notifySms: true,
        notifyWhatsapp: true,
        overrideEmail: 'tech.zone1@farm.com',
        overridePhone: '+212600000000',
      })
    );
    const got = getNotificationConfigById('cfg-1');
    expect(got?.overrideEmail).toBe('tech.zone1@farm.com');
    expect(got?.overridePhone).toBe('+212600000000');
  });
});

describe('multi-sector per zone', () => {
  it('keeps several configs for one zone, isolated from other zones', () => {
    saveZoneNotificationConfig(makeConfig({ configId: 'a', zoneId: 1 }));
    saveZoneNotificationConfig(makeConfig({ configId: 'b', zoneId: 1 }));
    saveZoneNotificationConfig(makeConfig({ configId: 'c', zoneId: 2 }));
    expect(
      getNotificationConfigsForZone(1)
        .map((c) => c.configId)
        .sort()
    ).toEqual(['a', 'b']);
    expect(getNotificationConfigsForZone(2).map((c) => c.configId)).toEqual([
      'c',
    ]);
    expect(hasZoneNotificationConfig(1)).toBe(true);
    expect(hasZoneNotificationConfig(3)).toBe(false);
  });
});

describe('delete', () => {
  it('removes a single config by id', () => {
    saveZoneNotificationConfig(makeConfig({ configId: 'a' }));
    saveZoneNotificationConfig(makeConfig({ configId: 'b' }));
    deleteNotificationConfigById('a');
    expect(getNotificationConfigById('a')).toBeUndefined();
    expect(getNotificationConfigById('b')).toBeDefined();
  });

  it('removes every config for a zone only', () => {
    saveZoneNotificationConfig(makeConfig({ configId: 'a', zoneId: 1 }));
    saveZoneNotificationConfig(makeConfig({ configId: 'b', zoneId: 1 }));
    saveZoneNotificationConfig(makeConfig({ configId: 'c', zoneId: 2 }));
    deleteAllNotificationConfigsForZone(1);
    expect(getNotificationConfigsForZone(1)).toEqual([]);
    expect(getNotificationConfigsForZone(2)).toHaveLength(1);
  });
});

describe('throttle state', () => {
  it('records lastNotifiedAt without touching other fields', () => {
    saveZoneNotificationConfig(makeConfig({ notificationName: 'keep-me' }));
    recordZoneNotificationSent('cfg-1', '2026-06-15T10:00:00.000Z');
    const got = getNotificationConfigById('cfg-1');
    expect(got?.lastNotifiedAt).toBe('2026-06-15T10:00:00.000Z');
    expect(got?.notificationName).toBe('keep-me');
  });
});

describe('config-updated events', () => {
  it('dispatches on save and on delete', () => {
    const handler = jest.fn();
    window.addEventListener(ZONE_NOTIFICATION_CONFIG_UPDATED_EVENT, handler);
    saveZoneNotificationConfig(makeConfig());
    deleteNotificationConfigById('cfg-1');
    window.removeEventListener(ZONE_NOTIFICATION_CONFIG_UPDATED_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe('findNotificationConfigForZoneRow', () => {
  it('returns the single config for a zone', () => {
    saveZoneNotificationConfig(makeConfig({ configId: 'a', zoneId: 7 }));
    expect(findNotificationConfigForZoneRow(7)?.configId).toBe('a');
  });
  it('disambiguates multiple configs by name', () => {
    saveZoneNotificationConfig(
      makeConfig({ configId: 'a', zoneId: 7, notificationName: 'Bloc A' })
    );
    saveZoneNotificationConfig(
      makeConfig({ configId: 'b', zoneId: 7, notificationName: 'Bloc B' })
    );
    expect(findNotificationConfigForZoneRow(7, 'Bloc B')?.configId).toBe('b');
    expect(findNotificationConfigForZoneRow(7)).toBeUndefined();
    expect(findNotificationConfigForZoneRow(null)).toBeUndefined();
  });
});

describe('thresholdsFromConfig', () => {
  it('falls back to defaults when no config', () => {
    expect(thresholdsFromConfig(undefined)).toEqual({
      humidityCriticalPct: 20,
      et0KcAdvisoryMm: 4,
    });
  });
  it('maps the config thresholds', () => {
    expect(
      thresholdsFromConfig(
        makeConfig({ criticalThresholdPct: 35, et0KcAdvisoryMm: 6 })
      )
    ).toEqual({ humidityCriticalPct: 35, et0KcAdvisoryMm: 6 });
  });
});

describe('representativeKcFromStages', () => {
  it('weights mid-Kc by duration over active stages', () => {
    const kc = representativeKcFromStages([
      {
        stageName: 's1',
        durationDays: 10,
        kcStart: 0.4,
        kcEnd: 0.6,
        amountMm: 0,
        active: true,
      },
      {
        stageName: 's2',
        durationDays: 30,
        kcStart: 0.8,
        kcEnd: 1.0,
        amountMm: 0,
        active: true,
      },
    ]);
    // mids 0.5 (10d) and 0.9 (30d) → (0.5*10 + 0.9*30)/40 = 0.8
    expect(kc).toBeCloseTo(0.8, 5);
  });
  it('ignores inactive stages, falls back when none', () => {
    const kc = representativeKcFromStages([
      {
        stageName: 's1',
        durationDays: 10,
        kcStart: 0.4,
        kcEnd: 0.6,
        amountMm: 0,
        active: false,
      },
    ]);
    expect(kc).toBeCloseTo(0.5, 5);
  });
});

describe('legacy migration', () => {
  it('backfills configId from a legacy numeric-keyed map and coerces valve to manual', () => {
    const legacy = {
      '5': {
        zoneId: 5,
        valveMode: 'auto',
        intervalMinutes: 240,
        notificationName: 'old',
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    const all = getAllZoneNotificationConfigs();
    expect(all).toHaveLength(1);
    expect(all[0].configId).toBeTruthy();
    expect(all[0].valveMode).toBe('manual');
    // intervalMinutes 240 → derived delivery rate of 4 hours
    expect(all[0].deliveryRate).toEqual({ amount: 4, unit: 'hour' });
  });

  it('coerces a stored valveMode "auto" to "manual" on read', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'cfg-z': { ...makeConfig({ configId: 'cfg-z' }), valveMode: 'auto' },
      })
    );
    expect(getNotificationConfigById('cfg-z')?.valveMode).toBe('manual');
  });

  it('survives stale dropped fields (soilCharacteristics / soilMoistureSource)', () => {
    const raw = {
      'cfg-old': {
        ...makeConfig({ configId: 'cfg-old' }),
        soilCharacteristics: 'TAW & RAW & FC & WP',
        soilMoistureSource: 'avg_sensors',
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    const got = getNotificationConfigById('cfg-old');
    expect(got).toBeDefined();
    expect(got?.soilTawMm).toBe(120);
  });

  it('ignores corrupt JSON gracefully', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(getAllZoneNotificationConfigs()).toEqual([]);
  });
});
