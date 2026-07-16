// app/layout.tsx
import './globals.scss';
import { Metadata, Viewport } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ColorModeScript } from '@chakra-ui/react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Providers } from './providers';
import { chakraColorModeConfig } from './colorModeConfig';
import { dirFor, type Locale } from '../i18n/config';

export const metadata: Metadata = {
  title: { default: 'Agrogo', template: '%s · Agrogo' },
  description:
    'Agrogo is an innovative agriculture automation solution designed to enhance productivity, sustainability, and efficiency in farming. By utilizing smart technology and data-driven insights, Agrogo optimizes irrigation, crop monitoring, and supply chain management, empowering farmers to achieve higher yields and reduce costs while promoting eco-friendly practices.',
  // Field use is mostly mobile — make "add to home screen" behave like an app.
  applicationName: 'Agrogo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Agrogo',
  },
};

// Brand-green browser chrome on mobile (primary[600]); explicit viewport so
// the address bar / status bar match the app instead of the OS default.
export const viewport: Viewport = {
  themeColor: '#1f7740',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ColorModeScript
          initialColorMode={chakraColorModeConfig.initialColorMode}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AntdRegistry>
            <Providers locale={locale as Locale}>{children}</Providers>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
