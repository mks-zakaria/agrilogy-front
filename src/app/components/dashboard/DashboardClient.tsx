'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuthTokens } from '@/app/lib/checkAuthTokens';
import MainContent from '@/app/components/dashboard/MainContent';
import { AppPageShell } from '@/app/components/layout/AppPageShell';

/** Client shell for the dashboard route: auth gate + page content.
 * Split out so the route's page.tsx can stay a server component and export
 * per-page metadata (browser-tab title). */
export default function DashboardClient() {
  const router = useRouter();

  useEffect(() => {
    if (!checkAuthTokens()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <AppPageShell>
      <MainContent />
    </AppPageShell>
  );
}
