'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate } from '@mifos/api-client';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { SectorCascadeSelect } from '@/components/clients/shared/sector-cascade-select';
import { toSelectOptions, customerClassToSelectOptions } from '@/lib/form/select-options';
import { filterEligibleCustomerClasses } from '@/lib/fineract/customer-class-eligibility';
import type { ClientGeneralFormState, CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

export function CustomerProfilingStep({
  template,
  draft,
  errors,
  onDraftChange
}: {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  errors: StepErrors;
  onDraftChange: (patch: Partial<ClientGeneralFormState>) => void;
}) {
  const g = draft.general;
  const eligibleCustomerClasses = filterEligibleCustomerClasses(template.customerClassOptions, {
    legalFormId: g.legalFormId,
    dateOfBirth: g.dateOfBirth
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Customer class, sub-industry, tax details, and internal risk categorization. Most fields
        are optional and can be updated later.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="taxIdentificationNumber"
          className="sm:col-span-2"
          label="Tax identification number (TIN)"
          optional
          value={g.taxIdentificationNumber ?? ''}
          onChange={(v) => onDraftChange({ taxIdentificationNumber: v })}
          error={errors.taxIdentificationNumber}
          hint="Optional. Minors and others may not have a TIN."
        />

        <SectorCascadeSelect
          subIndustryId={g.subIndustryId}
          onSubIndustryIdChange={(subIndustryId) => onDraftChange({ subIndustryId })}
          error={errors.subIndustryId}
        />

        <SelectField
          id="customerRiskProfileId"
          className="sm:col-span-2"
          label="Customer risk profile"
          optional
          value={g.customerRiskProfileId ? String(g.customerRiskProfileId) : undefined}
          onValueChange={(v) =>
            onDraftChange({ customerRiskProfileId: v ? Number(v) : undefined })
          }
          options={toSelectOptions(template.customerRiskProfileOptions)}
          placeholder="Select risk profile"
          hint="Very High, High, Medium, Low, or Very Low."
          error={errors.customerRiskProfileId}
        />

        <SelectField
          id="customerClassId"
          className="sm:col-span-2"
          label="Customer class"
          optional
          value={g.customerClassId ? String(g.customerClassId) : undefined}
          onValueChange={(v) => onDraftChange({ customerClassId: v ? Number(v) : undefined })}
          options={customerClassToSelectOptions(eligibleCustomerClasses)}
          placeholder="Select customer class"
          hint="Only classes matching age, legal form, and risk profile are listed. KYC and documents are checked at activation."
          error={errors.customerClassId}
        />
      </div>
    </div>
  );
}
