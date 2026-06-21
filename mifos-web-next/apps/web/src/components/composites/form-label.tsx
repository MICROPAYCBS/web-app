/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { ContextHelpFieldHint } from '@/components/composites/context-help/context-help-field-hint';
import { FieldHintTooltip } from '@/components/composites/field-hint-tooltip';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormLabelProps {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  /** When false and not required, shows “(optional)”. */
  optional?: boolean;
  /** Shown in an info tooltip beside the label. */
  hint?: string;
  hintAriaLabel?: string;
  /** Opens context help sidebar focused on this section (when a provider is mounted). */
  contextHelpSectionId?: string;
  className?: string;
}

export function FormLabel({
  htmlFor,
  children,
  required = false,
  optional = !required,
  hint,
  hintAriaLabel,
  contextHelpSectionId,
  className
}: FormLabelProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
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
      {contextHelpSectionId ? (
        <ContextHelpFieldHint
          sectionId={contextHelpSectionId}
          fallbackHint={hint}
          ariaLabel={hintAriaLabel ?? 'Field help'}
        />
      ) : hint ? (
        <FieldHintTooltip content={hint} ariaLabel={hintAriaLabel} />
      ) : null}
    </div>
  );
}
