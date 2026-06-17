import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import VannesPompesMain from '../components/main/VannesPompesMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('vannesPompes') };
}

const Page = () => {
  return (
    <AppPageShell>
      <VannesPompesMain />
    </AppPageShell>
  );
};

export default Page;
