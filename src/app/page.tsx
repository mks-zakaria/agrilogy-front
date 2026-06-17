import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import DashboardClient from './components/dashboard/DashboardClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('dashboard') };
}

const Page = () => <DashboardClient />;

export default Page;
