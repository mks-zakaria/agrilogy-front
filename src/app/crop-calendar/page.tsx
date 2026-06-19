import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CropCalendarMain from '../components/cropCalendar/CropCalendarMain';
import { AppPageShell } from '../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('cropCalendar') };
}

const Page = () => {
  return (
    <AppPageShell>
      <CropCalendarMain />
    </AppPageShell>
  );
};

export default Page;
