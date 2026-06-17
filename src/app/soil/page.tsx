import React from 'react';
import type { Metadata } from 'next';
import SoilMain from '../components/main/SoilMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export const metadata: Metadata = { title: 'Sol' };

const Page = () => {
  return (
    <AppPageShell>
      <SoilMain />
    </AppPageShell>
  );
};

export default Page;
