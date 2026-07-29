'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ContactType,
  FineractClientTemplate,
  FineractIncomeSourceOptions
} from '@mifos/api-client';
import { PreviewStep } from '@/components/clients/create/steps/preview-step';
import type { CreateClientDraft } from '@/components/clients/create/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type CreateClientCheckerReviewProps = {
  draft: CreateClientDraft;
  template: FineractClientTemplate;
  incomeSourceOptions?: FineractIncomeSourceOptions;
  identifierDocumentTypes?: { id: number; name: string }[];
  contactTypeOptions?: ContactType[];
};

/** Structured CREATE_CLIENT review for the checker approve screen. */
export function CreateClientCheckerReview({
  draft,
  template,
  incomeSourceOptions,
  identifierDocumentTypes = [],
  contactTypeOptions = []
}: CreateClientCheckerReviewProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Customer details</CardTitle>
      </CardHeader>
      <CardContent>
        <PreviewStep
          mode="review"
          template={template}
          draft={draft}
          submitError={null}
          incomeSourceOptions={incomeSourceOptions}
          identifierDocumentTypes={identifierDocumentTypes}
          contactTypeOptions={contactTypeOptions}
        />
      </CardContent>
    </Card>
  );
}
