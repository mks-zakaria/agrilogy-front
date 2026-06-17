import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import StationMain from '../components/main/StationMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('station') };
}

const Page = () => {
  return (
    <AppPageShell>
      <StationMain />
    </AppPageShell>
  );
};

export default Page;
