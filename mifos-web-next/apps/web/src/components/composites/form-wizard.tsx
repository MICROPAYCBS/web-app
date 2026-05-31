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
    <div className={cn('mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-6', className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <nav aria-label="Progress">
        <ol className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const isActive = step.id === currentStepId;
            const isPast = index < currentIndex;
            return (
              <li key={step.id}>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && isPast && 'bg-muted text-foreground',
                    !isActive && !isPast && 'bg-muted/50 text-muted-foreground'
                  )}
                >
                  {index + 1}. {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="rounded-lg border bg-card p-4 shadow-sm md:p-6">{children}</div>
    </div>
  );
}
