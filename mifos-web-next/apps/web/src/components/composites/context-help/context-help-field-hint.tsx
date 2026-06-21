'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CircleHelp } from 'lucide-react';
import { useOptionalContextHelp } from '@/components/composites/context-help/context-help-provider';
import { FieldHintTooltip } from '@/components/composites/field-hint-tooltip';
import { cn } from '@/lib/utils';

/**
 * Opens the context help sidebar focused on a section. Falls back to a tooltip when
 * no {@link ContextHelpProvider} is mounted.
 */
export function ContextHelpFieldHint({
  sectionId,
  fallbackHint,
  ariaLabel = 'Field help',
  className
}: {
  sectionId: string;
  /** Shown in a tooltip when context help is unavailable (e.g. Storybook). */
  fallbackHint?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const contextHelp = useOptionalContextHelp();

  if (!contextHelp) {
    if (!fallbackHint) {
      return null;
    }
    return <FieldHintTooltip content={fallbackHint} ariaLabel={ariaLabel} />;
  }

  return (
    <button
      type="button"
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      aria-label={ariaLabel}
      onClick={() => contextHelp.openSection(sectionId)}
    >
      <CircleHelp className="size-3.5" aria-hidden />
    </button>
  );
}
