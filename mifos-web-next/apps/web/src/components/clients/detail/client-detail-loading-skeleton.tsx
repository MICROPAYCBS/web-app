'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { usePathname } from 'next/navigation';
import {
  ClientDetailGeneralSkeleton,
  ClientDetailTableTabSkeleton
} from '@/components/clients/detail/client-detail-skeleton';

function isClientGeneralTab(pathname: string): boolean {
  return pathname.endsWith('/general');
}

/**
 * Content-only skeleton for tab transitions (shell is already rendered by the layout).
 */
export function ClientDetailLoadingSkeleton() {
  const pathname = usePathname();

  if (isClientGeneralTab(pathname)) {
    return <ClientDetailGeneralSkeleton />;
  }

  return <ClientDetailTableTabSkeleton />;
}
