import React from 'react';
import type { Metadata } from 'next';
import VannesPompesMain from '../components/main/VannesPompesMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export const metadata: Metadata = { title: 'Vannes & pompes' };

const Page = () => {
  return (
    <AppPageShell>
      <VannesPompesMain />
    </AppPageShell>
  );
};

export default Page;
