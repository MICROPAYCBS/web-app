/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { platformContentArea } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

/** Single bounded dashboard pane below the site header — page shells scroll inside this. */
export function PlatformContentArea({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(platformContentArea, className)}>{children}</div>;
}
