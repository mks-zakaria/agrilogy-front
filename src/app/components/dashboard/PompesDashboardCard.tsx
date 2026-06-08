'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  VStack,
  Box,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import PompeCard, { Pompe } from './PompeCard';
import { pompeList } from '@/app/data/dashboard/pompes';
import Loading from '../common/Loading';
import DashboardCard from './DashboardCard';

const PompesList = () => {
  const t = useTranslations();
  const [pompes, setPompes] = useState<Pompe[]>([]);
  const tableBg = useColorModeValue('white', 'gray.800');
  const [loading, setLoading] = useState(true);
  const p = useBreakpointValue({ base: 2, md: 4 });

  const fetchPompes = async () => {
    try {
      setPompes(pompeList);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch pumps:', error);
    }
  };

  const handlePompeClick = (id: number) => {
    console.log(`Redirecting to config page for pump ${id}`);
  };

  useEffect(() => {
    fetchPompes();
  }, [loading]);

  if (loading) {
    return <Loading />;
  }

  const content = (
    <VStack spacing={4} align="stretch">
      {pompes.map((pompe: Pompe) => (
        <PompeCard
          key={pompe.id}
          pompe={pompe}
          onClick={() => handlePompeClick(pompe.id)}
        />
      ))}
    </VStack>
  );

  return (
    <Box
      width="100%"
      height="100%"
      bg={tableBg}
      borderRadius="md"
      p={p}
      overflowX="auto"
    >
      <DashboardCard
        title={t('shell.dashboard.pompesAvailable')}
        content={content}
      />
    </Box>
  );
};

export default PompesList;
