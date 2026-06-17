import React from 'react';
import type { Metadata } from 'next';
import PlantMain from '../components/main/PlantMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export const metadata: Metadata = { title: 'Plante' };

const Page = () => {
  return (
    <AppPageShell>
      <PlantMain />
    </AppPageShell>
  );
};

export default Page;
