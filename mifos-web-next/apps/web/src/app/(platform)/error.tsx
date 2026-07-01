'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect } from 'react';
import { RouteErrorPanel } from '@/components/composites/route-error-panel';
import { logClientError } from '@/lib/errors/log-client-error';

export default function PlatformError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError('platform-error', error, { digest: error.digest });
  }, [error]);

  return <RouteErrorPanel error={error} reset={reset} variant="page" />;
}
