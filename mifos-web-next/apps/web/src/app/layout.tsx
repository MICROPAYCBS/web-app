/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { Metadata } from 'next';
import { Geist_Mono, IBM_Plex_Sans, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { AppProviders } from '@/providers/app-providers';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/branding';
import { DEFAULT_COLOR_PRESET, SHADCN_PRESET_CODE } from '@/lib/theme-config';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans'
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`
  },
  description: APP_DESCRIPTION
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-svh overflow-hidden antialiased font-sans',
        inter.variable,
        ibmPlexSans.variable,
        geistMono.variable
      )}
      data-preset={DEFAULT_COLOR_PRESET}
      data-shadcn-preset={SHADCN_PRESET_CODE}
      suppressHydrationWarning
    >
      <body className="flex h-svh flex-col overflow-hidden">
        <ThemeProvider defaultTheme="system" enableSystem>
          <AppProviders>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
