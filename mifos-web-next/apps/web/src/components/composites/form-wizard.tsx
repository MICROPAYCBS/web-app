'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/composites/page-header';
import { cn } from '@/lib/utils';

export interface FormWizardStep {
  id: string;
  label: string;
}

export interface FormWizardProps {
  steps: FormWizardStep[];
  currentStepId: string;
  title: string;
  description?: string;
  children: ReactNode;
  /** Sticky Cancel / Previous / Next (or submit) actions below step content */
  footer?: ReactNode;
  /** When set, step labels in the rail are buttons and invoke this handler */
  onStepClick?: (stepId: string) => void;
  /** Step IDs that failed validation and still need attention */
  invalidStepIds?: readonly string[];
  className?: string;
}


function WizardStepIndicator({
  index,
  isActive,
  isPast,
  isInvalid
}: {
  index: number;
  isActive: boolean;
  isPast: boolean;
  isInvalid: boolean;
}) {
  return (
    <span
      className={cn(
        'relative flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
        isActive && 'border-primary-foreground/30 bg-primary-foreground/15',
        !isActive && isPast && 'border-border bg-background',
        !isActive && !isPast && 'border-border bg-muted/40',
        isInvalid && !isActive && 'ring-1 ring-destructive/60',
        isInvalid && isActive && 'ring-2 ring-destructive/50 ring-offset-1 ring-offset-primary'
      )}
    >
      {index + 1}
      {isInvalid ? (
        <span
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive ring-2 ring-background"
          aria-hidden
        />
      ) : null}
    </span>
  );
}

/**
 * Full-page multi-step form shell (ADR-006 exception for client create).
 * Sticky title at top; vertical steps on the left; step content on the right.
 */
export function FormWizard({
  steps,
  currentStepId,
  title,
  description,
  children,
  footer,
  onStepClick,
  invalidStepIds,
  className
}: FormWizardProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-6', className)}>
      <PageHeader>
        <div className="space-y-1 pt-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <nav
          aria-label="Progress"
          className="w-full shrink-0 lg:sticky lg:top-24 lg:w-56 lg:self-start xl:w-60"
        >
          <ol className="flex flex-col gap-1 border-b border-border pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            {steps.map((step, index) => {
              const isActive = step.id === currentStepId;
              const isPast = index < currentIndex;
              const isInvalid = invalidStepIds?.includes(step.id) ?? false;
              const isClickable = Boolean(onStepClick);
              const stepClassName = cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive && 'bg-primary text-primary-foreground',
                !isActive && isPast && 'bg-muted/60 text-foreground',
                !isActive && !isPast && 'text-muted-foreground',
                isClickable &&
                  !isActive &&
                  'cursor-pointer hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isClickable && isActive && 'cursor-default'
              );

              return (
                <li key={step.id}>
                  {isClickable ? (
                    <button
                      type="button"
                      className={cn(stepClassName, 'text-left')}
                      onClick={() => onStepClick?.(step.id)}
                      aria-current={isActive ? 'step' : undefined}
                      title={isInvalid ? 'Complete required fields on this step' : undefined}
                    >
                      <WizardStepIndicator
                        index={index}
                        isActive={isActive}
                        isPast={isPast}
                        isInvalid={isInvalid}
                      />
                      <span className="flex min-w-0 flex-col truncate">
                        <span className="truncate">{step.label}</span>
                        {isInvalid ? (
                          <span className="sr-only">Has required fields to fix</span>
                        ) : null}
                      </span>
                    </button>
                  ) : (
                    <span
                      className={stepClassName}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <WizardStepIndicator
                        index={index}
                        isActive={isActive}
                        isPast={isPast}
                        isInvalid={isInvalid}
                      />
                      <span className="min-w-0 truncate">{step.label}</span>
                      {isInvalid ? (
                        <span className="sr-only">Has required fields to fix</span>
                      ) : null}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="p-4 md:p-6">{children}</div>
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
