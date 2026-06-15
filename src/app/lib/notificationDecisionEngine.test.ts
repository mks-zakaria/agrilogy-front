/**
 * All-cases tests for the v1 notification decision engine.
 * Rules (in priority order):
 *   R0 — any non-finite input → advisory
 *   R1 — soil humidity <= critical threshold → critical
 *   R2 — ET0×Kc >= advisory threshold → advisory
 *   R3 — otherwise → ok
 */
import {
  DEFAULT_NOTIFICATION_THRESHOLDS,
  evaluateV1NotificationDecision,
  parseNumericSensor,
  type NotificationThresholds,
} from './notificationDecisionEngine';

const TH: NotificationThresholds = {
  humidityCriticalPct: 20,
  et0KcAdvisoryMm: 4,
};

describe('parseNumericSensor', () => {
  it('passes through finite numbers', () => {
    expect(parseNumericSensor(3.5)).toBe(3.5);
    expect(parseNumericSensor(0)).toBe(0);
  });
  it('parses strings, comma decimals and units', () => {
    expect(parseNumericSensor('12.5')).toBe(12.5);
    expect(parseNumericSensor('12,5')).toBe(12.5);
    expect(parseNumericSensor('45 %')).toBe(45);
    expect(parseNumericSensor('-3.2 kPa')).toBe(-3.2);
  });
  it('returns NaN for null/undefined/garbage', () => {
    expect(parseNumericSensor(null)).toBeNaN();
    expect(parseNumericSensor(undefined)).toBeNaN();
    expect(parseNumericSensor('abc')).toBeNaN();
  });
});

describe('evaluateV1NotificationDecision — R1 critical (humidity)', () => {
  it('fires critical when humidity is below the threshold', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 5,
      soilHumidityPct: 10,
      kc: 0.8,
      thresholds: TH,
    });
    expect(r.decision).toBe('critical');
    expect(r.rulesFired).toContain('R1_humidity_at_or_below_critical');
  });
  it('fires critical exactly AT the threshold (inclusive, EPS)', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 0,
      soilHumidityPct: 20,
      kc: 1,
      thresholds: TH,
    });
    expect(r.decision).toBe('critical');
  });
  it('critical wins even when ET0×Kc is also high', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 100,
      soilHumidityPct: 5,
      kc: 1,
      thresholds: TH,
    });
    expect(r.decision).toBe('critical');
    expect(r.rulesFired).toContain('R1_humidity_at_or_below_critical');
  });
});

describe('evaluateV1NotificationDecision — R2 advisory (ET0×Kc)', () => {
  it('fires advisory when ET0×Kc is at/above threshold and humidity ok', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 5,
      soilHumidityPct: 50,
      kc: 0.8, // 5*0.8 = 4.0 == threshold
      thresholds: TH,
    });
    expect(r.decision).toBe('advisory');
    expect(r.rulesFired).toContain('R2_et0_kc_above_advisory');
    expect(r.et0TimesKc).toBeCloseTo(4, 5);
  });
  it('stays ok when ET0×Kc is just below threshold', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 3,
      soilHumidityPct: 50,
      kc: 1, // 3.0 < 4
      thresholds: TH,
    });
    expect(r.decision).toBe('ok');
  });
});

describe('evaluateV1NotificationDecision — R3 ok', () => {
  it('is ok with healthy humidity and low demand', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 2,
      soilHumidityPct: 60,
      kc: 0.5,
      thresholds: TH,
    });
    expect(r.decision).toBe('ok');
    expect(r.rulesFired).toContain('R3_nominal');
  });
});

describe('evaluateV1NotificationDecision — R0 invalid input', () => {
  it.each([
    ['et0', { et0Mm: NaN, soilHumidityPct: 50, kc: 0.8 }],
    ['humidity', { et0Mm: 5, soilHumidityPct: NaN, kc: 0.8 }],
    ['kc', { et0Mm: 5, soilHumidityPct: 50, kc: NaN }],
    ['infinity', { et0Mm: Infinity, soilHumidityPct: 50, kc: 0.8 }],
  ])('returns advisory when %s is non-finite', (_label, partial) => {
    const r = evaluateV1NotificationDecision({ ...partial, thresholds: TH });
    expect(r.decision).toBe('advisory');
    expect(r.rulesFired).toContain('R0_invalid_numeric_input');
  });
});

describe('default thresholds', () => {
  it('match the engine constants', () => {
    expect(DEFAULT_NOTIFICATION_THRESHOLDS).toEqual({
      humidityCriticalPct: 20,
      et0KcAdvisoryMm: 4,
    });
  });
});
