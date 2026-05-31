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
 * Mirrors FormSheet footer actions; pinned below scrollable step content in the wizard card.
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
        'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-card px-4 py-4 md:px-6',
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
