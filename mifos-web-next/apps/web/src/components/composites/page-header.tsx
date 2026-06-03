/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sticky page title region inside the main scroll area (below the site header).
 * Negative horizontal margin aligns the border with the padded content edge.
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
        'sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 pb-4 backdrop-blur md:-mx-6 md:px-6',
        'supports-[backdrop-filter]:bg-background/80',
        className
      )}
    >
      {children}
    </div>
  );
}
