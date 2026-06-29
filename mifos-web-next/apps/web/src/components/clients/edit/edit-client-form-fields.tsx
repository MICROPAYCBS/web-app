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
import { useMemo } from 'react';
import { DateField } from '@/components/composites/date-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { SectorCascadeSelect } from '@/components/clients/shared/sector-cascade-select';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import { toSelectOptions, customerClassToSelectOptions } from '@/lib/form/select-options';
import { filterEligibleCustomerClasses } from '@/lib/fineract/customer-class-eligibility';
import { filterEligibleClientTitles } from '@/lib/fineract/client-title-eligibility';

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
  const eligibleCustomerClasses = filterEligibleCustomerClasses(initial.customerClassOptions, {
    legalFormId: form.legalFormId,
    dateOfBirth: form.dateOfBirth
  });
  const customerClassOptionsForSelect =
    form.customerClassId != null &&
    !eligibleCustomerClasses.some((customerClass) => customerClass.id === form.customerClassId)
      ? [
          ...eligibleCustomerClasses,
          ...(initial.customerClassOptions?.filter(
            (customerClass) => customerClass.id === form.customerClassId
          ) ?? [])
        ]
      : eligibleCustomerClasses;

  const eligibleTitles = useMemo(
    () =>
      filterEligibleClientTitles(
        initial.clientTitleOptions ?? initial.titleOptions,
        form.genderId
      ),
    [initial.clientTitleOptions, initial.titleOptions, form.genderId]
  );

  const selectedCustomerClass = useMemo(() => {
    if (form.customerClassId == null) {
      return undefined;
    }
    return (
      initial.customerClassOptions?.find((row) => row.id === form.customerClassId) ??
      customerClassOptionsForSelect.find((row) => row.id === form.customerClassId)
    );
  }, [form.customerClassId, initial.customerClassOptions, customerClassOptionsForSelect]);

  const riskProfileRequired = Boolean(selectedCustomerClass?.riskLevel?.trim());
  const relationshipOfficerRequired =
    typeof initial.staffId === 'number' && initial.staffId > 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
            <SelectField
              id="genderId"
              label="Gender"
              optional
              value={form.genderId ? String(form.genderId) : undefined}
              onValueChange={(v) => {
                const genderId = v ? (Number(v) as 1 | 2) : undefined;
                const titlesForGender = filterEligibleClientTitles(
                  initial.clientTitleOptions ?? initial.titleOptions,
                  genderId
                );
                const nextTitleId =
                  form.titleId != null && titlesForGender.some((title) => title.id === form.titleId)
                    ? form.titleId
                    : undefined;
                onPatch({ genderId, titleId: nextTitleId });
              }}
              options={toSelectOptions(initial.genderOptions)}
              placeholder="Select gender"
            />
            <SelectField
              id="titleId"
              label="Title"
              optional
              disabled={form.genderId == null}
              value={form.titleId ? String(form.titleId) : undefined}
              onValueChange={(v) => onPatch({ titleId: v ? Number(v) : undefined })}
              options={toSelectOptions(eligibleTitles)}
              placeholder={form.genderId != null ? 'Select title' : 'Select gender first'}
            />
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

        {legalFormId === LEGAL_FORM_PERSON ? (
          <SelectField
            id="nationalityCountryId"
            label="Nationality"
            optional
            value={form.nationalityCountryId ? String(form.nationalityCountryId) : undefined}
            onValueChange={(v) =>
              onPatch({ nationalityCountryId: v ? Number(v) : undefined })
            }
            options={toSelectOptions(initial.nationalityOptions)}
            placeholder="Select nationality"
          />
        ) : null}

        {legalFormId === LEGAL_FORM_PERSON ? (
          <SelectField
            id="maritalStatusId"
            label="Marital status"
            required
            value={form.maritalStatusId ? String(form.maritalStatusId) : undefined}
            onValueChange={(v) => onPatch({ maritalStatusId: v ? Number(v) : undefined })}
            options={toSelectOptions(initial.maritalStatusOptions)}
            placeholder="Select marital status"
            error={fieldError(fieldErrors, 'maritalStatusId')}
          />
        ) : null}

        <DateField
          id="dateOfBirth"
          label={legalFormId === LEGAL_FORM_PERSON ? 'Date of birth' : 'Incorporation date'}
          optional
          value={form.dateOfBirth}
          onChange={(v) => onPatch({ dateOfBirth: v })}
          dateFormat={tenantDateFormat}
        />

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
          className={legalFormId === LEGAL_FORM_PERSON ? 'sm:col-span-2' : undefined}
          label="Relationship officer"
          optional={!relationshipOfficerRequired}
          required={relationshipOfficerRequired}
          value={form.staffId ? String(form.staffId) : undefined}
          onValueChange={(v) => {
            if (!v && relationshipOfficerRequired) {
              return;
            }
            onPatch({ staffId: v ? Number(v) : undefined });
          }}
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
          id="externalId"
          label="External ID"
          optional
          value={form.externalId ?? ''}
          onChange={(v) => onPatch({ externalId: v })}
        />

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
          id="customerRiskProfileId"
          className="sm:col-span-2"
          label="Customer risk profile"
          required={riskProfileRequired}
          optional={!riskProfileRequired}
          value={
            form.customerRiskProfileId ? String(form.customerRiskProfileId) : undefined
          }
          onValueChange={(v) =>
            onPatch({ customerRiskProfileId: v ? Number(v) : undefined })
          }
          options={toSelectOptions(initial.customerRiskProfileOptions)}
          placeholder="Select risk profile"
          hint={
            riskProfileRequired
              ? `Required for class "${selectedCustomerClass?.className ?? selectedCustomerClass?.classCode}". Choose Very Low, Low, Medium, High, or Very High.`
              : 'Internal bank-use field for AML risk tiering.'
          }
          error={fieldError(fieldErrors, 'customerRiskProfileId')}
        />

        <SelectField
          id="customerClassId"
          className="sm:col-span-2"
          label="Customer class"
          optional
          value={form.customerClassId ? String(form.customerClassId) : undefined}
          onValueChange={(v) => onPatch({ customerClassId: v ? Number(v) : undefined })}
          options={customerClassToSelectOptions(customerClassOptionsForSelect)}
          placeholder="Select customer class"
          hint="Classes are filtered by legal form, age, and risk profile when those values are known. KYC and documents are checked at activation."
          error={fieldError(fieldErrors, 'customerClassId')}
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
