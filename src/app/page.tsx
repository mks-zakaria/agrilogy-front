import React from 'react';
import type { Metadata } from 'next';
import DashboardClient from './components/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'Tableau de bord' };

const Page = () => <DashboardClient />;

export default Page;
