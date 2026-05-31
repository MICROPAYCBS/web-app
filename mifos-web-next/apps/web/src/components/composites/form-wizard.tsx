'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
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
  className?: string;
}

/**
 * Full-page multi-step form shell (ADR-006 exception for client create).
 * Title and steps in a left rail; step content on the right.
 */
export function FormWizard({
  steps,
  currentStepId,
  title,
  description,
  children,
  className
}: FormWizardProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-8',
        className
      )}
    >
      <aside className="w-full shrink-0 lg:sticky lg:top-0 lg:w-56 lg:self-start xl:w-60">
        <div className="space-y-6 border-b border-border pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <nav aria-label="Progress">
            <ol className="flex flex-col gap-1">
              {steps.map((step, index) => {
                const isActive = step.id === currentStepId;
                const isPast = index < currentIndex;
                return (
                  <li key={step.id}>
                    <span
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive && 'bg-primary text-primary-foreground',
                        !isActive && isPast && 'bg-muted/60 text-foreground',
                        !isActive && !isPast && 'text-muted-foreground'
                      )}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                          isActive && 'border-primary-foreground/30 bg-primary-foreground/15',
                          !isActive && isPast && 'border-border bg-background',
                          !isActive && !isPast && 'border-border bg-muted/40'
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 truncate">{step.label}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="rounded-lg border bg-card p-4 shadow-sm md:p-6">{children}</div>
      </div>
    </div>
  );
}
