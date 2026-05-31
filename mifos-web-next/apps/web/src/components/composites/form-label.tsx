/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormLabelProps {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  /** When false and not required, shows “(optional)”. */
  optional?: boolean;
  className?: string;
}

export function FormLabel({
  htmlFor,
  children,
  required = false,
  optional = !required,
  className
}: FormLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={cn('text-sm font-medium', className)}>
      {children}
      {required ? (
        <span className="text-destructive" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
      {optional && !required ? (
        <span className="font-normal text-muted-foreground"> (optional)</span>
      ) : null}
    </Label>
  );
}
