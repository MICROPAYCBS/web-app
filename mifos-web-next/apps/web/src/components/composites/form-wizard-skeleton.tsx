/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { PageHeader } from '@/components/composites/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { platformInset, platformInsetX } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

export interface FormWizardSkeletonProps {
  title: string;
  description?: string;
  /** Placeholder steps in the left rail */
  stepCount?: number;
  className?: string;
}

function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

/**
 * Loading placeholder matching {@link FormWizard} layout (step rail + fields + footer).
 */
export function FormWizardSkeleton({
  title,
  description,
  stepCount = 5,
  className
}: FormWizardSkeletonProps) {
  return (
    <div className={cn('flex min-h-0 w-full flex-1 flex-col', className)}>
      <PageHeader>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </PageHeader>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav
          aria-hidden
          className={cn(
            'w-full shrink-0 border-b border-border lg:w-56 lg:min-h-0 lg:self-stretch lg:border-b-0 lg:border-r xl:w-60'
          )}
        >
          <ol className={cn('flex flex-col gap-1', platformInset, 'lg:py-6')}>
            {Array.from({ length: stepCount }).map((_, index) => (
              <li key={index}>
                <div
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2',
                    index === 0 && 'bg-primary/10'
                  )}
                >
                  <Skeleton className="size-6 shrink-0 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className={cn('min-h-0 flex-1 overflow-y-auto', platformInset)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <FormFieldSkeleton key={index} />
              ))}
            </div>
          </div>

          <div
            className={cn(
              'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background',
              platformInsetX,
              'py-4'
            )}
          >
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
