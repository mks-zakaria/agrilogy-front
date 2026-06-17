import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AlertMain from '../components/alert/AlertMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('alerts') };
}

const Page = () => {
  return (
    <AppPageShell>
      <AlertMain />
    </AppPageShell>
  );
};

export default Page;
