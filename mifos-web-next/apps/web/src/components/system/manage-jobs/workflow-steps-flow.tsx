'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractWorkflowJobStep } from '@mifos/api-client';
import { ArrowRight } from 'lucide-react';

export function WorkflowStepsFlow({ steps }: { steps: FineractWorkflowJobStep[] }) {
  if (!steps.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-4">
      {steps.map((step, index) => (
        <div key={`${step.stepName}-${index}`} className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <p className="font-medium">{step.stepName}</p>
            {step.stepDescription ? (
              <p className="text-xs text-muted-foreground">{step.stepDescription}</p>
            ) : null}
          </div>
          {index < steps.length - 1 ? <ArrowRight className="size-4 text-muted-foreground" /> : null}
        </div>
      ))}
    </div>
  );
}
