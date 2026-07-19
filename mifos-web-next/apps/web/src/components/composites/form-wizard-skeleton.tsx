/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FormWizardStep } from '@/components/composites/form-wizard';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/composites/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { platformInset, platformInsetX, platformPageShell, platformSidebarRowLayout } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

export interface FormWizardSkeletonProps {
  title: string;
  description?: string;
  /** Placeholder steps in the left rail when `steps` is omitted */
  stepCount?: number;
  /** Real step labels matching {@link FormWizard} (preferred over generic placeholders) */
  steps?: readonly FormWizardStep[];
  /** Which step appears active in the rail (default 0) */
  activeStepIndex?: number;
  /** Biodata-style intro line above the field grid */
  showIntro?: boolean;
  /** Fields in the 2-column content grid (ignored when `content` is set) */
  fieldCount?: number;
  /** When true, the last generic field spans both columns (default true) */
  fullWidthLastField?: boolean;
  /** Custom step body (e.g. biodata-shaped placeholder) */
  content?: ReactNode;
  className?: string;
}

function FormFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

function SkeletonStepIndicator({
  index,
  isActive
}: {
  index: number;
  isActive: boolean;
}) {
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
        isActive && 'border-primary-foreground/30 bg-primary-foreground/15',
        !isActive && 'border-border bg-muted/40'
      )}
    >
      {index + 1}
    </span>
  );
}

/**
 * Loading placeholder matching {@link FormWizard} layout (step rail + fields + footer).
 */
export function FormWizardSkeleton({
  title,
  description,
  stepCount = 5,
  steps,
  activeStepIndex = 0,
  showIntro = false,
  fieldCount = 8,
  fullWidthLastField = true,
  content,
  className
}: FormWizardSkeletonProps) {
  const railSteps = steps?.length
    ? steps
    : Array.from({ length: stepCount }, (_, index) => ({
        id: `step-${index}`,
        label: ''
      }));

  return (
    <div className={cn(platformPageShell, 'w-full', className)} aria-busy aria-label={`Loading ${title}`}>
      <PageHeader>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </PageHeader>

      <div className={platformSidebarRowLayout}>
        <nav
          aria-hidden
          className={cn(
            'w-full shrink-0 border-b border-border lg:w-56 lg:min-h-0 lg:self-stretch lg:border-b-0 lg:border-r xl:w-60'
          )}
        >
          <ol className={cn('flex flex-col gap-1', platformInset, 'lg:py-6')}>
            {railSteps.map((step, index) => {
              const isActive = index === activeStepIndex;
              return (
                <li key={step.id}>
                  <div
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                      isActive && 'bg-primary text-primary-foreground',
                      !isActive && 'text-muted-foreground'
                    )}
                  >
                    <SkeletonStepIndicator index={index} isActive={isActive} />
                    {step.label ? (
                      <span className="min-w-0 truncate">{step.label}</span>
                    ) : (
                      <Skeleton className="h-4 flex-1" />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className={cn('min-h-0 flex-1 overflow-y-auto', platformInset)}>
            {content ?? (
              <div className="space-y-6">
                {showIntro ? <Skeleton className="h-4 w-full max-w-lg" /> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: fieldCount }).map((_, index) => (
                    <FormFieldSkeleton
                      key={index}
                      className={
                        fullWidthLastField && index === fieldCount - 1
                          ? 'sm:col-span-2'
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background',
              platformInsetX,
              'py-4'
            )}
          >
            <Skeleton className="h-8 w-16" />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Skeleton className="h-9 w-[4.5rem] rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
