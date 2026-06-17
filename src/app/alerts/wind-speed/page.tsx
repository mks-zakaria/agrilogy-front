import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AppPageShell } from '../../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('windSpeed') };
}

const Page = () => {
  return (
    <AppPageShell>
      {/* AlersMain / WindSpeedMain placeholder */}
      AlersMain
    </AppPageShell>
  );
};

export default Page;
