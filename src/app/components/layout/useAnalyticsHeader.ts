'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import api from '@/app/lib/api';
import getActiveGraphs, {
  type ActiveGraphResponse,
} from '@/app/utils/getActiveGraphs';

import type { ChartFrequency } from '@/app/utils/chartDateWindow';

import type { ZoneOption } from './ZoneSelect';
import {
  type ChartDateRange,
  defaultChartDateRange,
} from './ChartDateRangeControl';

export type AnalyticsFilters = {
  startDate: string;
  endDate: string;
  selectedZone: number | null;
};

// Persist the user's zone + data-frequency choice so it carries across the
// four analytics pages and reloads (was reset to the first zone + hourly every
// visit). Date range is intentionally not persisted — an absolute window would
// go stale between sessions.
const ZONE_KEY = 'agrilogy_analytics_zone_v1';
const FREQ_KEY = 'agrilogy_analytics_frequency_v1';

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
  const [range, setRange] = useState<ChartDateRange>(defaultChartDateRange);
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

  // Restore the persisted frequency once on mount (client-only).
  useEffect(() => {
    const pref = readFrequencyPref();
    if (pref) setFrequencyState(pref);
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
