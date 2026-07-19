'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListFilter } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  DOCKED_SHEET_LAYOUT_CLASSNAME,
  dockedSheetSideMaxWidth
} from '@/components/composites/form-sheet';
import { cn } from '@/lib/utils';

/** Full-height docked panel — matches FormSheet and other app sidebars. */
export const listFilterSheetContentClassName = cn(
  DOCKED_SHEET_LAYOUT_CLASSNAME,
  dockedSheetSideMaxWidth.right
);

export interface ListFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  formId?: string;
  applyLabel?: string;
  clearLabel?: string;
  onApply?: () => void | boolean;
  onClear?: () => void;
  pending?: boolean;
  disabled?: boolean;
  /** When false, Clear keeps the sheet open. Default true. */
  closeOnClear?: boolean;
  side?: 'left' | 'right';
  className?: string;
}

export function ListFilterSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  formId,
  applyLabel = 'Apply filters',
  clearLabel = 'Clear filters',
  onApply,
  onClear,
  pending = false,
  disabled = false,
  closeOnClear = true,
  side = 'right',
  className
}: ListFilterSheetProps) {
  const generatedFormId = useId();
  const resolvedFormId = formId ?? generatedFormId;

  function handleApply() {
    const result = onApply?.();
    if (result === false) {
      return;
    }
    onOpenChange(false);
  }

  function handleClear() {
    onClear?.();
    if (closeOnClear) {
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton
        className={cn(DOCKED_SHEET_LAYOUT_CLASSNAME, dockedSheetSideMaxWidth[side], className)}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <form
            id={resolvedFormId}
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleApply();
            }}
          >
            {children}
          </form>
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background">
          {onClear ? (
            <Button type="button" variant="outline" onClick={handleClear} disabled={disabled || pending}>
              {clearLabel}
            </Button>
          ) : null}
          <Button type="submit" form={resolvedFormId} disabled={disabled || pending}>
            {pending ? 'Applying…' : applyLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Groups related filter fields with a title and optional guidance. */
export function ListFilterSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function ListFilterTrigger({
  activeCount = 0,
  onClick,
  disabled = false,
  label = 'Filters'
}: {
  activeCount?: number;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      <ListFilter className="mr-2 size-4" />
      {label}
      {activeCount > 0 ? (
        <Badge variant="secondary" className="ml-2">
          {activeCount}
        </Badge>
      ) : null}
    </Button>
  );
}
