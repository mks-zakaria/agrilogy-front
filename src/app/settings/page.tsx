import React from 'react';
import type { Metadata } from 'next';
import SettingsClient from '../components/settings/SettingsClient';

export const metadata: Metadata = { title: 'Paramètres' };

const Page = () => <SettingsClient />;

export default Page;
