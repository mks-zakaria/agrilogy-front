import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SettingsClient from '../components/settings/SettingsClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('settings') };
}

const Page = () => <SettingsClient />;

export default Page;
