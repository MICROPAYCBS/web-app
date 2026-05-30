/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

/** `mifos-web-next/` — workspace packages and lockfile live here, not under `apps/web`. */
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
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

export default nextConfig;
