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
