'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanScheduleData } from '@mifos/api-client';
import { LoanAccountSchedulePreview } from '@/components/clients/loan-account/loan-account-schedule-preview';

export function LoanAccountScheduleStep({
  schedule,
  loading = false,
  stale = false,
  error,
  fieldErrors,
  stepError,
  canPreview = true,
  onRecalculate
}: {
  schedule: LoanScheduleData | null;
  loading?: boolean;
  stale?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
  stepError?: string | null;
  canPreview?: boolean;
  onRecalculate?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Review the repayment schedule calculated from your loan terms and charges. Recalculate
          after any change on earlier steps, then continue to security and payout details.
        </p>
      </div>

      {stepError ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {stepError}
        </p>
      ) : null}

      <LoanAccountSchedulePreview
        layout="page"
        schedule={schedule}
        loading={loading}
        stale={stale}
        error={error}
        fieldErrors={fieldErrors}
        canPreview={canPreview}
        staleMessage="Terms changed since the last calculation — recalculate before continuing."
        idleMessage={
          canPreview
            ? 'Calculating repayment schedule from your loan terms…'
            : 'Complete loan terms on earlier steps to calculate the repayment schedule.'
        }
        onRecalculate={onRecalculate}
      />
    </div>
  );
}
