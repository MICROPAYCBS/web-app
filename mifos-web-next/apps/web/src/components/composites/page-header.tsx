/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { pageHeaderPadding, platformInsetX } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

/**
 * Fixed page title region — sits above a sibling scroll area (ListPage, DetailPage).
 * Border spans the full content panel width; copy sits on the standard inset.
 */
export function PageHeader({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'z-20 shrink-0 border-b border-border bg-background',
        platformInsetX,
        pageHeaderPadding,
        className
      )}
    >
      {children}
    </div>
  );
}
