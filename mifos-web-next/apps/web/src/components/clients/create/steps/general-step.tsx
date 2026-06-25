'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate } from '@mifos/api-client';
import { LEGAL_FORM_PERSON } from '@mifos/validation';
import { DateField } from '@/components/composites/date-field';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { ClientGeneralFormState, CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

export interface GeneralStepProps {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  errors: StepErrors;
  onDraftChange: (patch: Partial<ClientGeneralFormState>) => void;
}

export function GeneralStep({
  template,
  draft,
  errors,
  onDraftChange,
}: GeneralStepProps) {
  const g = draft.general;
  const legalFormId = g.legalFormId ?? LEGAL_FORM_PERSON;

  return (
    <div className="space-y-6">
      {errors._form ? <FormErrorAlert>{errors._form}</FormErrorAlert> : null}

      <p className="text-sm text-muted-foreground">
        Assign a relationship officer and set account opening details. The branch is taken from your
        signed-in account.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="staffId"
          label="Relationship officer"
          required
          value={g.staffId ? String(g.staffId) : undefined}
          onValueChange={(v) => onDraftChange({ staffId: v ? Number(v) : undefined })}
          options={toSelectOptions(
            template.staffOptions?.map((s) => ({
              id: s.id,
              displayName:
                s.displayName ??
                (`${s.firstname ?? ''} ${s.lastname ?? ''}`.trim() || `Relationship officer ${s.id}`)
            }))
          )}
          placeholder="Assign relationship officer"
          error={errors.staffId}
        />

        {legalFormId === LEGAL_FORM_PERSON ? (
          <SwitchField
            id="isStaff"
            label="Is staff"
            optional
            checked={g.isStaff ?? false}
            description="Mark if this customer is also an employee of the institution."
            onCheckedChange={(checked) => onDraftChange({ isStaff: checked })}
          />
        ) : null}

        <DateField
          id="submittedOnDate"
          label="Submitted on"
          required
          value={g.submittedOnDate}
          onChange={(v) => onDraftChange({ submittedOnDate: v ?? '' })}
          error={errors.submittedOnDate}
        />

        <SelectField
          id="savingsProductId"
          className="sm:col-span-2"
          label="Savings product on activation"
          optional
          value={g.savingsProductId ? String(g.savingsProductId) : undefined}
          onValueChange={(v) =>
            onDraftChange({ savingsProductId: v ? Number(v) : undefined })
          }
          options={toSelectOptions(
            template.savingProductOptions?.map((p) => ({ id: p.id, name: p.name }))
          )}
          placeholder="Select savings product"
          hint="Optional. When this customer is activated, a savings account is opened for the selected product."
          error={errors.savingsProductId}
        />
      </div>
    </div>
  );
}
