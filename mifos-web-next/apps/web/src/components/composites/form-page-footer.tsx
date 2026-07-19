'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FormPageFooterProps {
  cancelHref: string;
  cancelLabel?: string;
  submitLabel: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  submitLoadingLabel?: string;
  className?: string;
}

/**
 * Sticky footer for full-page forms. Mirrors {@link FormSheet} actions:
 * Cancel (outline) and Submit (primary), right-aligned.
 */
export function FormPageFooter({
  cancelHref,
  cancelLabel = 'Cancel',
  submitLabel,
  submitDisabled = false,
  submitLoading = false,
  submitLoadingLabel = 'Saving…',
  className
}: FormPageFooterProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 mt-auto flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card/95 px-6 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80',
        className
      )}
    >
      <Link
        href={cancelHref}
        className={cn(buttonVariants({ variant: 'outline' }), submitLoading && 'pointer-events-none opacity-50')}
        aria-disabled={submitLoading}
        tabIndex={submitLoading ? -1 : undefined}
      >
        {cancelLabel}
      </Link>
      <Button type="submit" disabled={submitDisabled || submitLoading}>
        {submitLoading ? submitLoadingLabel : submitLabel}
      </Button>
    </div>
  );
}
