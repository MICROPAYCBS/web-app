/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { findRouteByPath } from '@mifos/routes';
import { notFound } from 'next/navigation';
import { ComingSoonPage } from '@/components/platform/coming-soon-page';

export function RegistryRoutePage({ pathname }: { pathname: string }) {
  const route = findRouteByPath(pathname);

  if (!route) {
    notFound();
  }

  const legacyRef = route.parity.webAppRef;

  return (
    <ComingSoonPage
      title={route.label}
      description={
        legacyRef
          ? `Registered for parity with legacy web-app (${legacyRef}). Implementation is planned in a later iteration.`
          : undefined
      }
    />
  );
}
