/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use client';

import type { ReactNode } from 'react';
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

/** Recommended maximum logical fields — see docs/COMPONENTS.md */
export const FORM_SHEET_MAX_FIELDS = 7;

export interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Cancel label */
  cancelLabel?: string;
  submitLabel?: string;
  onCancel?: () => void;
  /** Called when Submit is pressed; use with form id + requestSubmit for RHF */
  onSubmit?: () => void;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  /** Optional form id — wires footer Submit to <form id={formId}> */
  formId?: string;
  /** Form-level error shown above children on its own row (not inside field grids). */
  error?: ReactNode;
  side?: 'left' | 'right';
  /** Panel width at `sm+`. Must use `data-[side=*]:` variants to override Sheet defaults. */
  className?: string;
}

const formSheetSideMaxWidth: Record<NonNullable<FormSheetProps['side']>, string> = {
  right: 'data-[side=right]:w-full data-[side=right]:sm:max-w-md',
  left: 'data-[side=left]:w-full data-[side=left]:sm:max-w-md'
};

/** Full-height docked panel layout shared by FormSheet and ListFilterSheet. */
export const DOCKED_SHEET_LAYOUT_CLASSNAME = 'flex flex-col gap-0 p-0';

export const dockedSheetSideMaxWidth = formSheetSideMaxWidth;

/**
 * Standard side panel for simple forms (1–7 logical fields).
 * Footer: Cancel (outline) + Submit (primary), sticky at bottom.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel = 'Cancel',
  submitLabel = 'Submit',
  onCancel,
  onSubmit,
  submitDisabled = false,
  submitLoading = false,
  formId,
  error,
  side = 'right',
  className
}: FormSheetProps) {
  function handleCancel() {
    onCancel?.();
    onOpenChange(false);
  }

  function handleFooterSubmit() {
    if (formId) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      if (form) {
        form.requestSubmit();
        return;
      }
    }
    onSubmit?.();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton
        className={cn(
          DOCKED_SHEET_LAYOUT_CLASSNAME,
          formSheetSideMaxWidth[side],
          className
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {error ? <div className="mb-4 flex justify-center">{error}</div> : null}
          {children}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={submitLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={submitDisabled || submitLoading}
            onClick={handleFooterSubmit}
          >
            {submitLoading ? 'Saving…' : submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
