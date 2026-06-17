import React from 'react';
import type { Metadata } from 'next';
import AlertMain from '../components/alert/AlertMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export const metadata: Metadata = { title: 'Alertes' };

const Page = () => {
  return (
    <AppPageShell>
      <AlertMain />
    </AppPageShell>
  );
};

export default Page;
