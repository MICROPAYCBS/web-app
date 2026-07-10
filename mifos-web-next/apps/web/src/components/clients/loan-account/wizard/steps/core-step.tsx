'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanAccountCoreStepInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanAccountStepErrors } from '../validation';

export function LoanAccountCoreStep({
  template,
  draft,
  errors,
  onChange,
  productLocked = false
}: {
  template: ClientLoanAccountTemplate;
  draft: LoanAccountCoreStepInput & { productId: number };
  errors: LoanAccountStepErrors;
  onChange: (patch: Partial<LoanAccountCoreStepInput>) => void;
  productLocked?: boolean;
}) {
  const productOptions = toSelectOptions(template.productOptions);
  const officerOptions = toSelectOptions(
    template.loanOfficerOptions?.map((officer) => ({
      id: officer.id,
      name: officer.displayName ?? String(officer.id)
    }))
  );
  const purposeOptions = toSelectOptions(template.loanPurposeOptions);
  const fundOptions = toSelectOptions(template.fundOptions);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose the loan product and supporting context for this application.
      </p>
      <DetailSection title="Loan product">
        <SelectField
          label="Loan product"
          required
          disabled={productLocked}
          value={draft.productId > 0 ? String(draft.productId) : undefined}
          onValueChange={(value) =>
            onChange({ productId: value ? Number(value) : undefined })
          }
          options={productOptions}
          placeholder="Select product"
          error={errors.productId}
          emptyMessage="No loan products available."
        />
      </DetailSection>
      <DetailSection title="Assignment & funding">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Loan officer"
            required
            value={draft.loanOfficerId ? String(draft.loanOfficerId) : undefined}
            onValueChange={(value) =>
              onChange({ loanOfficerId: value ? Number(value) : undefined })
            }
            options={officerOptions}
            placeholder="Select loan officer"
            error={errors.loanOfficerId}
            emptyMessage="No loan officers available."
          />
          <SelectField
            label="Loan purpose"
            optional
            value={draft.loanPurposeId ? String(draft.loanPurposeId) : undefined}
            onValueChange={(value) =>
              onChange({ loanPurposeId: value ? Number(value) : undefined })
            }
            options={purposeOptions}
            placeholder="Optional"
            error={errors.loanPurposeId}
            emptyMessage="No purposes configured."
          />
          <SelectField
            label="Fund"
            optional
            value={draft.fundId ? String(draft.fundId) : undefined}
            onValueChange={(value) => onChange({ fundId: value ? Number(value) : undefined })}
            options={fundOptions}
            placeholder="Optional"
            error={errors.fundId}
            emptyMessage="No funds configured."
          />
        </div>
      </DetailSection>
      <DetailSection title="Reference">
        <TextField
          id="loan-external-id"
          label="External ID"
          optional
          value={draft.externalId ?? ''}
          onChange={(externalId) => onChange({ externalId })}
          error={errors.externalId}
        />
      </DetailSection>
    </div>
  );
}
