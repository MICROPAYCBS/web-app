'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CircleHelp } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export function FieldHintTooltip({
  content,
  ariaLabel = 'Field help'
}: {
  content: string;
  ariaLabel?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={ariaLabel}
        onClick={(event) => event.preventDefault()}
      >
        <CircleHelp className="size-3.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-sm text-left leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/** Page or section title with optional help tooltip — same pattern as {@link FormLabel} hints. */
export function TitleWithHint({
  children,
  hint,
  hintAriaLabel = 'More information'
}: {
  children: ReactNode;
  hint?: string;
  hintAriaLabel?: string;
}) {
  if (!hint) {
    return children;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <FieldHintTooltip content={hint} ariaLabel={hintAriaLabel} />
    </span>
  );
}
