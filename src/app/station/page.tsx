import React from 'react';
import type { Metadata } from 'next';
import StationMain from '../components/main/StationMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export const metadata: Metadata = { title: 'Station' };

const Page = () => {
  return (
    <AppPageShell>
      <StationMain />
    </AppPageShell>
  );
};

export default Page;
