/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormErrorAlertProps {
  children: ReactNode;
  className?: string;
}

/**
 * Form-level validation or submit error — always full width, never sharing a grid row with fields.
 * When used inside a multi-column form grid, include `col-span-full` (applied by default).
 */
export function FormErrorAlert({ children, className }: FormErrorAlertProps) {
  return (
    <p
      role="alert"
      className={cn(
        'col-span-full w-full rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm whitespace-pre-line text-destructive',
        className
      )}
    >
      {children}
    </p>
  );
}
