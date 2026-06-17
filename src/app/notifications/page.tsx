import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import NotificationsMain from '../components/notifications/NotificationsMain';
import EmptyBox from '../components/common/EmptyBox';
import { AppPageShell } from '../components/layout/AppPageShell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta.title');
  return { title: t('notifications') };
}

const Page = () => {
  return (
    <AppPageShell>
      <Suspense fallback={<EmptyBox variant="loading" />}>
        <NotificationsMain />
      </Suspense>
    </AppPageShell>
  );
};

export default Page;
