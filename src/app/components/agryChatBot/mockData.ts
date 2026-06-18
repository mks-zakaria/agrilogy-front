/**
 * Demo data for the assistant's command cards. Purely illustrative so the
 * whole chat surface can be exercised without a backend — the real data will
 * come from the API once wired. Sensor / status labels resolve via i18n
 * (misc.chatbot.data.*); the values and zone names are left literal.
 */
export type Severity = 'critical' | 'warning' | 'ok';

export interface MockAlert {
  id: string;
  /** i18n key segment under misc.chatbot.data.sensor */
  sensorKey: string;
  zone: string;
  value: string;
  severity: Severity;
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: 'a1',
    sensorKey: 'soilMoisture',
    zone: 'Zone de maraîchage 1',
    value: '14 %',
    severity: 'critical',
  },
  {
    id: 'a2',
    sensorKey: 'vpd',
    zone: 'Zone de maraîchage 1',
    value: '2.1 kPa',
    severity: 'warning',
  },
  {
    id: 'a3',
    sensorKey: 'airTemp',
    zone: 'Verger nord',
    value: '31 °C',
    severity: 'warning',
  },
];

export interface MockMetric {
  /** i18n key segment under misc.chatbot.data.sensor */
  key: string;
  value: string;
  status: Severity;
}

export const MOCK_FARM_STATUS: MockMetric[] = [
  { key: 'soilMoisture', value: '14 %', status: 'critical' },
  { key: 'soilTemp', value: '22 °C', status: 'ok' },
  { key: 'vpd', value: '2.1 kPa', status: 'warning' },
  { key: 'et0', value: '5.3 mm', status: 'ok' },
  { key: 'airTemp', value: '28 °C', status: 'ok' },
  { key: 'humidity', value: '46 %', status: 'ok' },
];

export interface MockWeather {
  /** i18n key segment under misc.chatbot.data.weather */
  conditionKey: string;
  tempC: string;
  humidity: string;
  wind: string;
  et0: string;
}

export const MOCK_WEATHER: MockWeather = {
  conditionKey: 'sunny',
  tempC: '28 °C',
  humidity: '46 %',
  wind: '12 km/h',
  et0: '5.3 mm',
};
