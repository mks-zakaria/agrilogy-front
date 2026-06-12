import { Box, VStack } from '@chakra-ui/react';
import ChartDateRangeDragger from '../../common/ChartDateRangeDragger';
import ChartLastDataShell from '../../common/ChartLastDataShell';
import ChartDateRangeGate from '../../common/ChartDateRangeGate';
import { useChartFrequency } from '../../common/ChartFrequencyContext';
import {
  averageByFrequency,
  sortByTimestamp,
} from '@/app/utils/chartDateWindow';
import { useEffect, useMemo, useState } from 'react';
import api from '@/app/lib/api';
import { logOptionalApiFailure } from '@/app/utils/apiClientErrors';
import { useUnitOverridesRevision } from '@/app/hooks/useUnitOverridesRevision';
import { calibrateChartValue } from '@/app/utils/chartSeriesCalibration';
import VPDChart, { type VPDDataPoint } from './VPDChart';
import VPDLastData from './VPDLastData';
import { CHART_SHELL_MAX_HEIGHT } from '@/app/utils/chartAxisConfig';

interface VPDReading {
  id: number;
  timestamp: string;
  default_unit: string;
  available_units: string[];
  value: number;
  zone: number;
  user: number;
}

const VPDMain = ({
  filters,
}: {
  filters: {
    startDate: string;
    endDate: string;
    selectedZone: number | null;
  };
}) => {
  const { startDate, endDate, selectedZone } = filters;
  const [vpdData, setVpdData] = useState<VPDReading[]>([]);
  const [loading, setLoading] = useState(true);
  const unitRev = useUnitOverridesRevision();
  const freq = useChartFrequency();

  // VPD is computed + stored server-side (VPDWeather, hourly, kPa) by the same
  // task as ET0, so we read the series directly instead of re-deriving it from
  // humidity + temperature. The client-side join required exact-equal
  // timestamps and produced nothing when readings arrived on separate uplinks.
  useEffect(() => {
    setLoading(true);
    api
      .get<VPDReading[]>('/sensors/vpdweather', {
        params: {
          start_date: startDate,
          end_date: endDate,
          zone: selectedZone,
        },
      })
      .then((res) => setVpdData(res.data))
      .catch((err) => logOptionalApiFailure('VPDMain: fetch vpd', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate, selectedZone]);

  const series = useMemo((): VPDDataPoint[] => {
    const rows = vpdData
      .filter((d) => d.value != null && !Number.isNaN(d.value))
      .map((d) => ({
        timestamp: d.timestamp,
        vpd: calibrateChartValue('vpd', d.value),
      }));
    // Bucket the VPD series to the page frequency (avg per bucket).
    return averageByFrequency(sortByTimestamp(rows), freq);
  }, [vpdData, unitRev, freq]);

  const timeline = useMemo(() => series.map((d) => d.timestamp), [series]);

  return (
    <ChartLastDataShell
      spacing={2}
      direction={{ base: 'column', md: 'row' }}
      align="start"
      width="100%"
      className="Box"
      maxH={CHART_SHELL_MAX_HEIGHT}
      chart={
        <Box flex={3} p={2} width="100%" minW={0}>
          <ChartDateRangeGate timeline={timeline}>
            {({ startIdx, endIdx, setRange }) => (
              <VStack spacing={0} align="stretch" width="100%">
                <VPDChart
                  data={series.slice(startIdx, endIdx + 1)}
                  loading={loading}
                />
                <ChartDateRangeDragger
                  timestamps={timeline}
                  startIdx={startIdx}
                  endIdx={endIdx}
                  onChange={(r) => setRange(r)}
                />
              </VStack>
            )}
          </ChartDateRangeGate>
        </Box>
      }
      lastData={
        <Box
          flex={1}
          p={3}
          width="100%"
          minW={0}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="stretch"
        >
          <VPDLastData data={series} />
        </Box>
      }
    />
  );
};

export default VPDMain;
