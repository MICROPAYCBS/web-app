'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientEditData } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON, type UpdateClientInput, UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER } from '@mifos/validation';
import { DateField } from '@/components/composites/date-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { SectorCascadeSelect } from '@/components/clients/shared/sector-cascade-select';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import { toSelectOptions } from '@/lib/form/select-options';

function fieldError(errors: Record<string, string>, key: string): string | undefined {
  return errors[key];
}

export function EditClientFormFields({
  initial,
  form,
  fieldErrors,
  onPatch,
  onPatchNonPerson
}: {
  initial: FineractClientEditData;
  form: UpdateClientInput;
  fieldErrors: Record<string, string>;
  onPatch: (patch: Partial<UpdateClientInput>) => void;
  onPatchNonPerson: (
    patch: Partial<
      NonNullable<
        Extract<UpdateClientInput, { legalFormId: typeof LEGAL_FORM_ENTITY }>['clientNonPersonDetails']
      >
    >
  ) => void;
}) {
  const legalFormId = form.legalFormId;
  const active = form.active;
  const isEntity = legalFormId === LEGAL_FORM_ENTITY;
  const nonPerson = isEntity ? form.clientNonPersonDetails : undefined;
  const tenantDateFormat = form.dateFormat;
  const activationMinDate = fineractDateToDate(form.submittedOnDate, tenantDateFormat);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="externalId"
          className="sm:col-span-2"
          label="External ID"
          optional
          value={form.externalId ?? ''}
          onChange={(v) => onPatch({ externalId: v })}
        />

        {legalFormId === LEGAL_FORM_ENTITY ? (
          <TextField
            id="fullname"
            className="sm:col-span-2"
            label="Entity name"
            required
            value={form.fullname ?? ''}
            onChange={(v) => onPatch({ fullname: v })}
            error={fieldError(fieldErrors, 'fullname')}
          />
        ) : (
          <>
            <TextField
              id="firstname"
              label="First name"
              required
              value={form.firstname ?? ''}
              onChange={(v) => onPatch({ firstname: v })}
              error={fieldError(fieldErrors, 'firstname')}
            />
            <TextField
              id="middlename"
              label="Middle name"
              optional
              value={form.middlename ?? ''}
              onChange={(v) => onPatch({ middlename: v })}
            />
            <TextField
              id="lastname"
              label="Last name"
              required
              value={form.lastname ?? ''}
              onChange={(v) => onPatch({ lastname: v })}
              error={fieldError(fieldErrors, 'lastname')}
            />
          </>
        )}

        <DateField
          id="dateOfBirth"
          label={legalFormId === LEGAL_FORM_PERSON ? 'Date of birth' : 'Incorporation date'}
          optional
          value={form.dateOfBirth}
          onChange={(v) => onPatch({ dateOfBirth: v })}
          dateFormat={tenantDateFormat}
        />

        {legalFormId === LEGAL_FORM_PERSON ? (
          <SelectField
            id="genderId"
            label="Gender"
            optional
            value={form.genderId ? String(form.genderId) : undefined}
            onValueChange={(v) => onPatch({ genderId: v ? Number(v) : undefined })}
            options={toSelectOptions(initial.genderOptions)}
            placeholder="Select gender"
          />
        ) : null}

        {isEntity && nonPerson ? (
          <>
            <SelectField
              id="constitutionId"
              label="Constitution"
              required
              value={nonPerson.constitutionId ? String(nonPerson.constitutionId) : undefined}
              onValueChange={(v) => onPatchNonPerson({ constitutionId: Number(v) })}
              options={toSelectOptions(initial.clientNonPersonConstitutionOptions)}
              placeholder="Select constitution"
              error={fieldError(fieldErrors, 'clientNonPersonDetails.constitutionId')}
            />
            <SelectField
              id="mainBusinessLineId"
              label="Main business line"
              optional
              value={
                nonPerson.mainBusinessLineId ? String(nonPerson.mainBusinessLineId) : undefined
              }
              onValueChange={(v) =>
                onPatchNonPerson({ mainBusinessLineId: v ? Number(v) : undefined })
              }
              options={toSelectOptions(initial.clientNonPersonMainBusinessLineOptions)}
              placeholder="Select business line"
            />
            <DateField
              id="incorpValidityTillDate"
              label="Incorporation validity till"
              optional
              allowFuture
              value={nonPerson.incorpValidityTillDate}
              onChange={(v) => onPatchNonPerson({ incorpValidityTillDate: v })}
            />
            <TextField
              id="incorpNumber"
              label="Incorporation number"
              optional
              value={nonPerson.incorpNumber ?? ''}
              onChange={(v) => onPatchNonPerson({ incorpNumber: v })}
            />
            <TextField
              id="remarks"
              className="sm:col-span-2"
              label="Remarks"
              optional
              multiline
              value={nonPerson.remarks ?? ''}
              onChange={(v) => onPatchNonPerson({ remarks: v })}
            />
          </>
        ) : null}

        <SelectField
          id="staffId"
          label="Relationship officer"
          optional
          value={form.staffId ? String(form.staffId) : undefined}
          onValueChange={(v) => onPatch({ staffId: v ? Number(v) : undefined })}
          options={toSelectOptions(
            initial.staffOptions?.map((s) => ({
              id: s.id,
              displayName:
                s.displayName ??
                (`${s.firstname ?? ''} ${s.lastname ?? ''}`.trim() || `Relationship officer ${s.id}`)
            }))
          )}
          placeholder="Assign relationship officer"
        />

        {legalFormId === LEGAL_FORM_PERSON ? (
          <SwitchField
            id="isStaff"
            label="Is staff"
            optional
            checked={form.isStaff ?? false}
            description="Mark if this customer is also an employee of the institution."
            onCheckedChange={(checked) => onPatch({ isStaff: checked })}
          />
        ) : null}

        <TextField
          id="mobileNo"
          label="Phone number"
          optional
          type="tel"
          autoComplete="tel"
          placeholder={UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER}
          value={form.mobileNo ?? ''}
          onChange={(v) => onPatch({ mobileNo: v })}
          error={fieldError(fieldErrors, 'mobileNo')}
        />

        <TextField
          id="alternativeMobileNo"
          label="Alternative phone number"
          optional
          type="tel"
          autoComplete="tel"
          placeholder={UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER}
          value={form.alternativeMobileNo ?? ''}
          onChange={(v) => onPatch({ alternativeMobileNo: v })}
          error={fieldError(fieldErrors, 'alternativeMobileNo')}
        />

        <TextField
          id="emailAddress"
          label="Email"
          optional
          type="email"
          value={form.emailAddress ?? ''}
          onChange={(v) => onPatch({ emailAddress: v })}
          error={fieldError(fieldErrors, 'emailAddress')}
        />

        <TextField
          id="alternativeEmailAddress"
          label="Alternative email"
          optional
          type="email"
          value={form.alternativeEmailAddress ?? ''}
          onChange={(v) => onPatch({ alternativeEmailAddress: v })}
          error={fieldError(fieldErrors, 'alternativeEmailAddress')}
        />

        <TextField
          id="taxIdentificationNumber"
          label="Tax identification number (TIN)"
          optional
          value={form.taxIdentificationNumber ?? ''}
          onChange={(v) => onPatch({ taxIdentificationNumber: v })}
          error={fieldError(fieldErrors, 'taxIdentificationNumber')}
          hint="Optional. Minors and others may not have a TIN."
        />

        <SectorCascadeSelect
          subIndustryId={form.subIndustryId}
          onSubIndustryIdChange={(subIndustryId) => onPatch({ subIndustryId })}
          error={fieldError(fieldErrors, 'subIndustryId')}
        />

        <SelectField
          id="clientTypeId"
          label="Customer type"
          optional
          value={form.clientTypeId ? String(form.clientTypeId) : undefined}
          onValueChange={(v) => onPatch({ clientTypeId: v ? Number(v) : undefined })}
          options={toSelectOptions(initial.clientTypeOptions)}
          placeholder="Select customer type"
        />

        <SelectField
          id="clientClassificationId"
          label="Customer classification"
          optional
          value={
            form.clientClassificationId ? String(form.clientClassificationId) : undefined
          }
          onValueChange={(v) =>
            onPatch({ clientClassificationId: v ? Number(v) : undefined })
          }
          options={toSelectOptions(initial.clientClassificationOptions)}
          placeholder="Select classification"
        />

        <DateField
          id="submittedOnDate"
          label="Submitted on"
          required
          value={form.submittedOnDate}
          onChange={(v) => onPatch({ submittedOnDate: v ?? '' })}
          dateFormat={tenantDateFormat}
          error={fieldError(fieldErrors, 'submittedOnDate')}
        />

        {active && form.activationDate ? (
          <DateField
            id="activationDate"
            label="Activated on"
            required
            value={form.activationDate}
            onChange={(v) => onPatch({ activationDate: v })}
            fromDate={activationMinDate}
            dateFormat={tenantDateFormat}
            error={fieldError(fieldErrors, 'activationDate')}
          />
        ) : null}
    </div>
  );
}
