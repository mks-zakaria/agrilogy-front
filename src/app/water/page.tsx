import React from 'react';
import type { Metadata } from 'next';
import WaterMain from '../components/main/WaterMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export const metadata: Metadata = { title: 'Eau' };

const Page = () => {
  return (
    <AppPageShell>
      <WaterMain />
    </AppPageShell>
  );
};

export default Page;
