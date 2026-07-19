/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { TitleWithHint } from '@/components/composites/field-hint-tooltip';
import { PageHeader } from '@/components/composites/page-header';
import { pageHeaderContentSpacing, platformInset, platformPageShell } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

export function ListPage({
  title,
  description,
  titleHint,
  titleHintAriaLabel,
  backLink,
  meta,
  actions,
  toolbar,
  children,
  className
}: {
  title: ReactNode;
  description?: string;
  /** Shown in an info tooltip beside the title — prefer over `description` for long copy. */
  titleHint?: string;
  titleHintAriaLabel?: string;
  /** Placed above the title — use {@link DetailBackLink}. */
  backLink?: ReactNode;
  /** Secondary line under the title (description context, not navigation). */
  meta?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(platformPageShell, className)}>
      <PageHeader>
        <div className={pageHeaderContentSpacing}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              {backLink ? <div>{backLink}</div> : null}
              <h1 className="text-2xl font-semibold tracking-tight">
                <TitleWithHint hint={titleHint} hintAriaLabel={titleHintAriaLabel}>
                  {title}
                </TitleWithHint>
              </h1>
              {meta ? <div className="text-sm text-muted-foreground">{meta}</div> : null}
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
          {toolbar ? <div>{toolbar}</div> : null}
        </div>
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={cn(platformInset, 'space-y-4')}>{children}</div>
      </div>
    </div>
  );
}
