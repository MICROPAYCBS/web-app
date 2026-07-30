'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import { LoanAccountPreviewStep } from '@/components/clients/loan-account/wizard/steps/preview-step';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';

export type CreateLoanCheckerReviewData = {
  draft: LoanAccountDraft;
  template: ClientLoanAccountTemplate;
};

/** Structured CREATE LOAN review for the checker approve screen. */
export function CreateLoanCheckerReview({ draft, template }: CreateLoanCheckerReviewData) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Loan application details</CardTitle>
      </CardHeader>
      <CardContent>
        <LoanAccountPreviewStep mode="review" template={template} draft={draft} />
      </CardContent>
    </Card>
  );
}
