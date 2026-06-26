/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

/** `mifos-web-next/` — workspace packages and lockfile live here, not under `apps/web`. */
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const sentryTunnelRoute = process.env.SENTRY_TUNNEL_ROUTE ?? '/monitoring';

const nextConfig: NextConfig = {
  env: {
    /** Baked at build time so the browser can tell production vs preview deploys. */
    NEXT_PUBLIC_DEPLOY_ENV: process.env.VERCEL_ENV ?? 'local'
  },
  turbopack: {
    root: monorepoRoot
  },
  transpilePackages: [
    '@mifos/auth',
    '@mifos/routes',
    '@mifos/api-client',
    '@mifos/domain',
    '@mifos/i18n',
    '@mifos/ui',
    '@mifos/validation'
  ],
  experimental: {
    strictRouteTypes: true,
    appNewScrollHandler: true
  }
};

const uploadSourceMaps =
  Boolean(process.env.SENTRY_AUTH_TOKEN) && process.env.VERCEL_ENV === 'production';

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  tunnelRoute: sentryTunnelRoute,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !uploadSourceMaps
  }
});
