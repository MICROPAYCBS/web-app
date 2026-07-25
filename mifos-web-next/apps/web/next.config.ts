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

/**
 * Dev-only: allow self-signed Fineract TLS before the server starts so Node warns once at
 * startup instead of on the first BFF request (login, dashboard KPIs, etc.).
 */
if (process.env.NODE_ENV === 'development') {
  const strictTls = process.env.FINERACT_STRICT_TLS?.trim().toLowerCase();
  const allowInsecureTls = strictTls !== '1' && strictTls !== 'true';
  if (allowInsecureTls && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

const sentryTunnelRoute = process.env.SENTRY_TUNNEL_ROUTE ?? '/monitoring';

const nextConfig: NextConfig = {
  env: {
    /** Baked at build time so the browser can tell production vs preview deploys. */
    NEXT_PUBLIC_DEPLOY_ENV: process.env.VERCEL_ENV ?? 'local'
  },
  /** Playwright and local tooling often hit the app via 127.0.0.1 rather than localhost. */
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
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
    /** Collapse per-segment link prefetches (reduces RSC fan-out after refresh in Next 16). */
    prefetchInlining: true
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
