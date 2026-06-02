/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import type { CollectionViewMode } from './collection-view-mode';
import { cn } from '@/lib/utils';

export function CollectionViewLayout({
  mode,
  children,
  className
}: {
  mode: CollectionViewMode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        mode === 'grid'
          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
          : 'divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10',
        className
      )}
    >
      {children}
    </div>
  );
}
