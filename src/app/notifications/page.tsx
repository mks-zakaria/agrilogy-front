import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import NotificationsMain from '../components/notifications/NotificationsMain';
import EmptyBox from '../components/common/EmptyBox';
import { AppPageShell } from '../components/layout/AppPageShell';

export const metadata: Metadata = { title: 'Notifications' };

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
