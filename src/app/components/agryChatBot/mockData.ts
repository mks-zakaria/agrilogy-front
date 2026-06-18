/**
 * Mock fallback data — shaped EXACTLY like the agri-api `/assistant` tool
 * responses, so the cards render identically whether the data came from the
 * backend or from here. Used only when the backend is unreachable (offline /
 * not-yet-deployed); the real values come from the HTTP tools.
 */
export type Severity = 'critical' | 'warning' | 'ok' | 'unknown';

export interface AlertRow {
  id: number | string;
  name: string;
  sensor_key: string;
  zone: string | null;
  condition: string | null;
  threshold: number | null;
  last_triggered_at: string | null;
  severity: Severity;
}

export interface MetricRow {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  status?: Severity;
}

export const MOCK_ALERTS: { alerts: AlertRow[] } = {
  alerts: [
    {
      id: 1,
      name: 'Humidité du sol basse',
      sensor_key: 'soilMoisture',
      zone: 'Zone de maraîchage 1',
      condition: '<',
      threshold: 20,
      last_triggered_at: '2026-06-18T09:12:00Z',
      severity: 'warning',
    },
    {
      id: 2,
      name: 'VPD élevé',
      sensor_key: 'vpd',
      zone: 'Zone de maraîchage 1',
      condition: '>',
      threshold: 1.5,
      last_triggered_at: null,
      severity: 'ok',
    },
  ],
};

export const MOCK_FARM_STATUS: { metrics: MetricRow[] } = {
  metrics: [
    {
      key: 'soilMoisture',
      label: 'Soil moisture',
      value: 14,
      unit: '%',
      status: 'critical',
    },
    {
      key: 'soilTemp',
      label: 'Soil temperature',
      value: 22,
      unit: '°C',
      status: 'ok',
    },
    { key: 'vpd', label: 'VPD', value: 2.1, unit: 'kPa', status: 'warning' },
    { key: 'et0', label: 'ET0', value: 5.3, unit: 'mm', status: 'ok' },
    {
      key: 'airTemp',
      label: 'Air temperature',
      value: 28,
      unit: '°C',
      status: 'ok',
    },
    {
      key: 'humidity',
      label: 'Air humidity',
      value: 46,
      unit: '%',
      status: 'ok',
    },
  ],
};

export interface ZoneRow {
  id: number | string;
  name: string;
  area_m2: number | null;
  critical_moisture: number | null;
  soil_param_TAW?: number | null;
  soil_param_FC?: number | null;
  soil_param_WP?: number | null;
  soil_param_RAW?: number | null;
}

export const MOCK_ZONES: { zones: ZoneRow[] } = {
  zones: [
    {
      id: 1,
      name: 'Zone de maraîchage 1',
      area_m2: 1200,
      critical_moisture: 20,
      soil_param_TAW: 50,
      soil_param_FC: 32,
      soil_param_WP: 12,
      soil_param_RAW: 25,
    },
    {
      id: 2,
      name: 'Verger sud',
      area_m2: 3400,
      critical_moisture: 25,
      soil_param_TAW: 60,
      soil_param_FC: 35,
      soil_param_WP: 14,
      soil_param_RAW: 30,
    },
  ],
};

export const MOCK_WEATHER: { metrics: MetricRow[] } = {
  metrics: [
    { key: 'airTemp', label: 'Air temperature', value: 28, unit: '°C' },
    { key: 'humidity', label: 'Air humidity', value: 46, unit: '%' },
    { key: 'pressure', label: 'Pressure', value: 1013, unit: 'hPa' },
    { key: 'et0', label: 'ET0', value: 5.3, unit: 'mm' },
    { key: 'vpd', label: 'VPD', value: 2.1, unit: 'kPa' },
  ],
};

export const MOCK_SOIL: { metrics: MetricRow[] } = {
  metrics: [
    {
      key: 'soilMoistureMedium',
      label: 'Soil moisture (medium)',
      value: 18,
      unit: '%',
      status: 'warning',
    },
    {
      key: 'soilMoistureHigh',
      label: 'Soil moisture (shallow)',
      value: 24,
      unit: '%',
      status: 'ok',
    },
    {
      key: 'soilTempMedium',
      label: 'Soil temperature (medium)',
      value: 21,
      unit: '°C',
      status: 'ok',
    },
    { key: 'phSoil', label: 'Soil pH', value: 6.8, unit: 'pH', status: 'ok' },
    {
      key: 'soilSalinity',
      label: 'Soil salinity',
      value: 1.2,
      unit: 'dS/m',
      status: 'ok',
    },
    {
      key: 'ecSoilMedium',
      label: 'Soil EC (medium)',
      value: 1.4,
      unit: 'dS/m',
      status: 'ok',
    },
  ],
};

export const MOCK_PLANT: { metrics: MetricRow[] } = {
  metrics: [
    {
      key: 'leafMoisture',
      label: 'Leaf moisture',
      value: 62,
      unit: '%',
      status: 'ok',
    },
    {
      key: 'leafTemperature',
      label: 'Leaf temperature',
      value: 24,
      unit: '°C',
      status: 'ok',
    },
    {
      key: 'fruitSize',
      label: 'Fruit size',
      value: 41,
      unit: 'mm',
      status: 'ok',
    },
    {
      key: 'largeFruitDiameter',
      label: 'Large fruit diameter',
      value: 58,
      unit: 'mm',
      status: 'ok',
    },
  ],
};

export const MOCK_WATER: { metrics: MetricRow[] } = {
  metrics: [
    {
      key: 'waterFlow',
      label: 'Water flow',
      value: 3.4,
      unit: 'L/s',
      status: 'ok',
    },
    {
      key: 'waterPressure',
      label: 'Water pressure',
      value: 2.1,
      unit: 'Bar',
      status: 'ok',
    },
    {
      key: 'waterEC',
      label: 'Water conductivity',
      value: 780,
      unit: 'µS/cm',
      status: 'ok',
    },
    { key: 'waterPH', label: 'Water pH', value: 7.1, unit: 'pH', status: 'ok' },
    {
      key: 'precipitation',
      label: 'Precipitation rate',
      value: 0,
      unit: 'mm/h',
      status: 'ok',
    },
    {
      key: 'waterLevel',
      label: 'Water level',
      value: 145,
      unit: 'cm',
      status: 'ok',
    },
  ],
};

export type TrendDirection = 'rising' | 'falling' | 'flat';

export interface TrendRow {
  key: string;
  label: string;
  unit: string;
  latest: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  count: number;
  direction: TrendDirection;
  window_start: string;
  window_end: string;
  error?: string;
}

export const MOCK_TREND: TrendRow = {
  key: 'soilMoisture',
  label: 'Soil moisture',
  unit: '%',
  latest: 31.4,
  min: 24.8,
  max: 33.2,
  avg: 29.6,
  count: 96,
  direction: 'falling',
  window_start: '2026-06-17T22:00:00Z',
  window_end: '2026-06-18T22:00:00Z',
};

export type IrrigationRecommendation = 'irrigate' | 'hold' | 'unknown';

export interface IrrigationRow {
  recommendation: IrrigationRecommendation;
  reason: string;
  soil_moisture_pct: number | null;
  critical_moisture_threshold: number | null;
  soil_moisture_status: Severity;
  et0_mm: number | null;
  vpd_kpa: number | null;
  dr_today_mm: number | null;
  raw_mm: number | null;
  zone_name: string | null;
  zone_area_m2: number | null;
  estimated_water_m3: number | null;
  estimated_duration_min: number | null;
  morning_volume_m3: number | null;
  evening_volume_m3: number | null;
  decision_source: string;
  last_update_timestamp: string | null;
}

export const MOCK_IRRIGATION: IrrigationRow = {
  recommendation: 'irrigate',
  reason: 'Humidité du sol 18.0 % < seuil critique 30.0 %.',
  soil_moisture_pct: 18.0,
  critical_moisture_threshold: 30.0,
  soil_moisture_status: 'critical',
  et0_mm: 4.6,
  vpd_kpa: 1.3,
  dr_today_mm: null,
  raw_mm: null,
  zone_name: 'Zone 1',
  zone_area_m2: 1750.0,
  estimated_water_m3: 3.5,
  estimated_duration_min: 58.0,
  morning_volume_m3: null,
  evening_volume_m3: null,
  decision_source: 'critical_threshold_fallback',
  last_update_timestamp: '2026-06-18T20:00:00Z',
};

export interface NotificationRow {
  id: number | string;
  title: string;
  message: string;
  date: string | null;
  type: string;
}

export const MOCK_NOTIFICATIONS: { notifications: NotificationRow[] } = {
  notifications: [
    {
      id: 1,
      title: 'Irrigation 2026-06-18',
      message: 'ET0 4.6 mm · sol 18 % · 19 °C · 06:00 - 07:00',
      date: '2026-06-18T05:30:00Z',
      type: 'irrigation_summary',
    },
    {
      id: 2,
      title: 'Irrigation 2026-06-17',
      message: 'ET0 4.2 mm · sol 24 % · 18 °C · 06:00 - 07:00',
      date: '2026-06-17T05:30:00Z',
      type: 'irrigation_summary',
    },
  ],
};
