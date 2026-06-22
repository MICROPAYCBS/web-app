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
import { cn } from '@/lib/utils';

/** Floating inset panel — keeps list content full width while filters are open. */
export const listFilterSheetContentClassName = cn(
  'flex flex-col gap-0 p-0',
  'data-[side=right]:inset-y-auto data-[side=right]:top-4 data-[side=right]:right-4 data-[side=right]:bottom-4',
  'data-[side=left]:inset-y-auto data-[side=left]:top-4 data-[side=left]:left-4 data-[side=left]:bottom-4',
  'data-[side=right]:h-auto data-[side=left]:h-auto',
  'data-[side=right]:max-h-[calc(100dvh-2rem)] data-[side=left]:max-h-[calc(100dvh-2rem)]',
  'data-[side=right]:w-full data-[side=left]:w-full',
  'data-[side=right]:sm:max-w-md data-[side=left]:sm:max-w-md',
  'rounded-xl border shadow-xl'
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
  onApply?: () => void;
  onClear?: () => void;
  pending?: boolean;
  disabled?: boolean;
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
    onApply?.();
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
        className={cn(listFilterSheetContentClassName, className)}
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
