'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import api from '@/app/lib/api';
import getActiveGraphs, {
  type ActiveGraphResponse,
} from '@/app/utils/getActiveGraphs';

import type { ChartFrequency } from '@/app/utils/chartDateWindow';

import type { ZoneOption } from './ZoneSelect';
import {
  type ChartDateRange,
  defaultChartDateRange,
  DATE_PRESETS,
} from './ChartDateRangeControl';

export type AnalyticsFilters = {
  startDate: string;
  endDate: string;
  selectedZone: number | null;
};

// Persist the user's zone + data-frequency + range choice so they carry across
// the four analytics pages and reloads (was reset to the first zone + hourly +
// 24h every visit). The date range is persisted only as a *relative preset*
// (its day-span) and recomputed against "today" on load, so it never freezes
// to a stale absolute window; custom calendar ranges are not persisted.
const ZONE_KEY = 'agrilogy_analytics_zone_v1';
const FREQ_KEY = 'agrilogy_analytics_frequency_v1';
const RANGE_KEY = 'agrilogy_analytics_range_days_v1';

const todayIso = () => dayjs().format('YYYY-MM-DD');

/** A relative "last N days" window ending today. */
const rangeFromDays = (days: number): ChartDateRange => ({
  startDate: dayjs()
    .subtract(days - 1, 'day')
    .format('YYYY-MM-DD'),
  endDate: todayIso(),
});

/** The matching preset day-span if `r` is a "last N days ending today" window. */
const presetDaysForRange = (r: ChartDateRange): number | null => {
  if (r.endDate !== todayIso()) return null;
  const p = DATE_PRESETS.find(
    (preset) => rangeFromDays(preset.days).startDate === r.startDate
  );
  return p ? p.days : null;
};

const readRangeDaysPref = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(RANGE_KEY);
    const n = v != null ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

const readZonePref = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(ZONE_KEY);
    const n = v != null ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

const readFrequencyPref = (): ChartFrequency | null => {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(FREQ_KEY);
    return v ? (JSON.parse(v) as ChartFrequency) : null;
  } catch {
    return null;
  }
};

const writePref = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — ignore */
  }
};

const removePref = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export type AnalyticsHeaderState = {
  zones: ZoneOption[];
  selectedZone: number | null;
  setSelectedZone: (id: number) => void;
  zoneName: string | null;
  range: ChartDateRange;
  setRange: (next: ChartDateRange) => void;
  /** Page-wide chart data frequency. Charts bucket+average themselves to it. */
  frequency: ChartFrequency;
  setFrequency: (next: ChartFrequency) => void;
  activeGraph: ActiveGraphResponse | null;
  filters: AnalyticsFilters;
};

/**
 * One hook for the four analytics pages (station / soil / water / plant).
 * Holds zones + selected zone + date range + per-zone activeGraph config
 * and exposes the `filters` object every chart sub-component expects.
 */
export function useAnalyticsHeader(): AnalyticsHeaderState {
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [selectedZone, setSelectedZoneState] = useState<number | null>(null);
  const [activeGraph, setActiveGraph] = useState<ActiveGraphResponse | null>(
    null
  );
  const [range, setRangeState] = useState<ChartDateRange>(defaultChartDateRange);
  // Default to hourly so freshly-loaded pages tame high-frequency devices
  // (e.g. router 02's per-minute flood) out of the box.
  const [frequency, setFrequencyState] = useState<ChartFrequency>({
    kind: 'hour',
  });

  const setSelectedZone = useCallback((id: number) => {
    setSelectedZoneState(id);
    writePref(ZONE_KEY, String(id));
  }, []);

  const setFrequency = useCallback((next: ChartFrequency) => {
    setFrequencyState(next);
    writePref(FREQ_KEY, JSON.stringify(next));
  }, []);

  const setRange = useCallback((next: ChartDateRange) => {
    setRangeState(next);
    // Persist only preset windows (as a relative day-span); drop custom ranges
    // so we never restore a stale/misleading absolute window.
    const days = presetDaysForRange(next);
    if (days != null) writePref(RANGE_KEY, String(days));
    else removePref(RANGE_KEY);
  }, []);

  // Restore the persisted frequency + range preset once on mount (client-only).
  useEffect(() => {
    const freqPref = readFrequencyPref();
    if (freqPref) setFrequencyState(freqPref);
    const days = readRangeDaysPref();
    if (days != null) setRangeState(rangeFromDays(days));
  }, []);

  useEffect(() => {
    api
      .get<ZoneOption[]>('/zones')
      .then((res) => {
        const list = res.data ?? [];
        setZones(list);
        if (list.length > 0) {
          // Prefer the persisted zone when it's still one the user owns.
          const pref = readZonePref();
          const initial =
            pref != null && list.some((z) => z.id === pref) ? pref : list[0].id;
          setSelectedZoneState(initial);
        }
      })
      .catch((err) => console.error('Failed to fetch zones', err));
  }, []);

  useEffect(() => {
    if (selectedZone !== null)
      getActiveGraphs(selectedZone).then(setActiveGraph);
  }, [selectedZone]);

  const zoneName = useMemo(
    () => zones.find((z) => z.id === selectedZone)?.name ?? null,
    [zones, selectedZone]
  );

  const filters = useMemo(
    () => ({
      startDate: range.startDate,
      endDate: range.endDate,
      selectedZone,
    }),
    [range.startDate, range.endDate, selectedZone]
  );

  return {
    zones,
    selectedZone,
    setSelectedZone,
    zoneName,
    range,
    setRange,
    frequency,
    setFrequency,
    activeGraph,
    filters,
  };
}
