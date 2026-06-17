import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PlantMain from '../components/main/PlantMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('plant') };
}

const Page = () => {
  return (
    <AppPageShell>
      <PlantMain />
    </AppPageShell>
  );
};

export default Page;
