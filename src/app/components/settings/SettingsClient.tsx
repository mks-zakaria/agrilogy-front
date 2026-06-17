'use client';

import React, { useEffect, useState } from 'react';
import SettingsMain from '@/app/components/settings/SettingsMain';
import { AppPageShell } from '@/app/components/layout/AppPageShell';

/** Client shell for the settings route. Split out so page.tsx can stay a
 * server component and export per-page metadata. The mount gate avoids a
 * hydration mismatch from client-only settings state. */
export default function SettingsClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AppPageShell>
      <SettingsMain />
    </AppPageShell>
  );
}
