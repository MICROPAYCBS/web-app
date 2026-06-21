'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '@mifos/validation';
import { DateField } from '@/components/composites/date-field';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { ClientGeneralFormState, CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

export interface GeneralStepProps {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  errors: StepErrors;
  onDraftChange: (patch: Partial<ClientGeneralFormState>) => void;
  onTemplateChange: (template: FineractClientTemplate) => void;
}

export function GeneralStep({
  template,
  draft,
  errors,
  onDraftChange,
  onTemplateChange,
}: GeneralStepProps) {
  const g = draft.general;
  const legalFormId = g.legalFormId ?? LEGAL_FORM_PERSON;
  const nonPerson = g.clientNonPersonDetails ?? {};

  async function reloadTemplateForBranch(officeId: number) {
    const res = await fetch(`/api/clients/template?officeId=${officeId}`);
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as FineractClientTemplate;
    if (data?.staffOptions) {
      onTemplateChange({
        ...template,
        ...data,
        officeOptions: template.officeOptions,
        datatables: data.datatables ?? template.datatables
      });
    }
  }

  const legalFormOptions = toSelectOptions(
    template.clientLegalFormOptions?.length
      ? template.clientLegalFormOptions
      : [
          { id: LEGAL_FORM_PERSON, value: 'Person' },
          { id: LEGAL_FORM_ENTITY, value: 'Entity' }
        ]
  );

  return (
    <div className="space-y-6">
      {errors._form ? <FormErrorAlert>{errors._form}</FormErrorAlert> : null}

      <p className="text-sm text-muted-foreground">
        Branch assignment, profile type, and account opening details for this customer.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="officeId"
          label="Branch"
          required
          value={g.officeId ? String(g.officeId) : undefined}
          onValueChange={(v) => {
            const id = Number(v);
            onDraftChange({ officeId: id });
            void reloadTemplateForBranch(id);
          }}
          options={toSelectOptions(template.officeOptions)}
          placeholder="Select branch"
          error={errors.officeId}
        />

        <SelectField
          id="legalFormId"
          label="Profile type"
          required
          value={String(legalFormId)}
          onValueChange={(v) => {
            const id = Number(v);
            if (id === LEGAL_FORM_PERSON) {
              onDraftChange({
                legalFormId: id,
                fullname: undefined,
                clientNonPersonDetails: undefined,
                firstname: g.firstname ?? '',
                lastname: g.lastname ?? ''
              });
            } else {
              onDraftChange({
                legalFormId: id,
                firstname: undefined,
                middlename: undefined,
                lastname: undefined,
                fullname: g.fullname ?? '',
                isStaff: false,
                clientNonPersonDetails: { constitutionId: nonPerson.constitutionId }
              });
            }
          }}
          options={legalFormOptions}
          error={errors.legalFormId}
        />

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

        <TextField
          id="externalId"
          label="External ID"
          optional
          value={g.externalId ?? ''}
          onChange={(v) => onDraftChange({ externalId: v })}
        />

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
