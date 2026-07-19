'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanScheduleData } from '@mifos/api-client';
import type { LoanApplicationProductContext } from '@mifos/validation';
import { formatActionErrorMessage, loanApplicationHasScheduleMinimumFields } from '@mifos/validation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateClientLoanScheduleAction } from '@/actions/client-loan-account';
import { isClientLoanAccountActionError } from '@/lib/fineract/client-account-action-result';
import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';
import { loanApplicationValidationContext } from '@/lib/fineract/loan-application-rules';

export function useLoanSchedulePreview({
  clientId,
  draft,
  template,
  enabled = true,
  debounceMs = 400
}: {
  clientId: string;
  draft: LoanAccountDraft;
  template: ClientLoanAccountTemplate;
  enabled?: boolean;
  debounceMs?: number;
}) {
  const productContext = useMemo(
    () => loanApplicationValidationContext(template, draft),
    [draft, template]
  );
  const [schedule, setSchedule] = useState<LoanScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [previewDigest, setPreviewDigest] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const canPreview =
    enabled &&
    loanApplicationHasScheduleMinimumFields(
      draft,
      productContext.linkedToFloatingInterestRates
    );
  const draftDigest = useMemo(() => JSON.stringify(draft), [draft]);
  const isStale = previewDigest != null && previewDigest !== draftDigest;

  const runPreview = useCallback(async () => {
    if (!canPreview) {
      setSchedule(null);
      setError(null);
      setFieldErrors({});
      setPreviewDigest(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = await calculateClientLoanScheduleAction(
      clientId,
      draft,
      productContext as LoanApplicationProductContext
    );

    if (requestId !== requestIdRef.current) {
      return;
    }

    setLoading(false);

    if (isClientLoanAccountActionError(result)) {
      setError(formatActionErrorMessage(result.message, result.fieldErrors));
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    setSchedule(result.schedule);
    setPreviewDigest(draftDigest);
  }, [canPreview, clientId, draft, draftDigest, productContext]);

  useEffect(() => {
    if (!canPreview) {
      setSchedule(null);
      setPreviewDigest(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void runPreview();
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [canPreview, debounceMs, draftDigest, runPreview]);

  return {
    schedule,
    loading,
    error,
    fieldErrors,
    stale: isStale,
    canPreview,
    hasSuccessfulPreview: schedule != null && previewDigest === draftDigest && !loading,
    recalculate: runPreview,
    productContext
  };
}
