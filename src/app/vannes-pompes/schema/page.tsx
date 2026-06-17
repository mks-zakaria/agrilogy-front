import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import VannesPompesSchemaMain from '@/app/components/vannes-pompes/VannesPompesSchemaMain';
import { AppPageShell } from '@/app/components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('schema') };
}

const Page = () => {
  return (
    <AppPageShell density="compact">
      <VannesPompesSchemaMain />
    </AppPageShell>
  );
};

export default Page;
