import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SoilMain from '../components/main/SoilMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('soil') };
}

const Page = () => {
  return (
    <AppPageShell>
      <SoilMain />
    </AppPageShell>
  );
};

export default Page;
