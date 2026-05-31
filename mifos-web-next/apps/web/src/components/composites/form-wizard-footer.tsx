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

export interface FormWizardFooterProps {
  cancelHref: string;
  cancelLabel?: string;
  showBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
  backDisabled?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryLoadingLabel?: string;
  className?: string;
}

/**
 * Sticky navigation footer for full-page wizards (Cancel, Back, Next/Submit).
 * Mirrors FormSheet footer actions; sticks to the bottom while step content scrolls.
 */
export function FormWizardFooter({
  cancelHref,
  cancelLabel = 'Cancel',
  showBack = false,
  onBack,
  backLabel = 'Previous',
  backDisabled = false,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  primaryLoadingLabel,
  className
}: FormWizardFooterProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur md:-mx-6 md:px-6',
        'supports-[backdrop-filter]:bg-background/80',
        className
      )}
    >
      <Link
        href={cancelHref}
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        {cancelLabel}
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {showBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={backDisabled || primaryLoading}
          >
            {backLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
        >
          {primaryLoading ? (primaryLoadingLabel ?? 'Please wait…') : primaryLabel}
        </Button>
      </div>
    </div>
  );
}
