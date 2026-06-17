import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import WaterMain from '../components/main/WaterMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('water') };
}

const Page = () => {
  return (
    <AppPageShell>
      <WaterMain />
    </AppPageShell>
  );
};

export default Page;
