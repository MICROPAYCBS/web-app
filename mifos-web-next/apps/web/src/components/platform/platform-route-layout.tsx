/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { platformRouteLayout } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

/** Passes height from {@link PlatformContentArea} into page shells (ListPage, DetailPage, FormWizard). */
export function PlatformRouteLayout({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(platformRouteLayout, className)}>{children}</div>;
}
