'use client';

import { createContext, useContext } from 'react';

/**
 * Lets a ChartSection learn its child chart's title (published by the chart's
 * ChartPanelHeading) so it can show that title when collapsed — without each
 * chart having to know about collapsing.
 */
export type ChartCollapseContextValue = {
  registerTitle: (title: string) => void;
};

export const ChartCollapseContext =
  createContext<ChartCollapseContextValue | null>(null);

export const useChartCollapse = () => useContext(ChartCollapseContext);
