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
import { useMemo } from 'react';
import { DateField } from '@/components/composites/date-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { toSelectOptions } from '@/lib/form/select-options';
import { filterEligibleClientTitles } from '@/lib/fineract/client-title-eligibility';
import type { ClientGeneralFormState, CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

export function BiodataStep({
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
  const legalFormId = g.legalFormId ?? LEGAL_FORM_PERSON;
  const nonPerson = g.clientNonPersonDetails ?? {};
  const isPerson = legalFormId === LEGAL_FORM_PERSON;
  const eligibleTitles = useMemo(
    () =>
      filterEligibleClientTitles(
        template.clientTitleOptions ?? template.titleOptions,
        g.genderId
      ),
    [template.clientTitleOptions, template.titleOptions, g.genderId]
  );

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
      <p className="text-sm text-muted-foreground">
        Profile type and {isPerson ? 'personal particulars' : 'registration details'} for this
        customer.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
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

        <TextField
          id="externalId"
          label="External ID"
          optional
          value={g.externalId ?? ''}
          onChange={(v) => onDraftChange({ externalId: v })}
          error={errors.externalId}
        />

        {legalFormId === LEGAL_FORM_ENTITY ? (
          <TextField
            id="fullname"
            className="sm:col-span-2"
            label="Entity name"
            required
            value={g.fullname ?? ''}
            onChange={(v) => onDraftChange({ fullname: v })}
            error={errors.fullname}
          />
        ) : (
          <>
            <SelectField
              id="genderId"
              label="Gender"
              required
              value={g.genderId ? String(g.genderId) : undefined}
              onValueChange={(v) => {
                const genderId = v ? Number(v) : undefined;
                const titlesForGender = filterEligibleClientTitles(
                  template.clientTitleOptions ?? template.titleOptions,
                  genderId
                );
                const nextTitleId =
                  g.titleId != null && titlesForGender.some((title) => title.id === g.titleId)
                    ? g.titleId
                    : undefined;
                onDraftChange({ genderId, titleId: nextTitleId });
              }}
              options={toSelectOptions(template.genderOptions)}
              placeholder="Select gender"
              error={errors.genderId}
            />
            <SelectField
              id="titleId"
              label="Title"
              optional
              disabled={g.genderId == null}
              value={g.titleId ? String(g.titleId) : undefined}
              onValueChange={(v) => onDraftChange({ titleId: v ? Number(v) : undefined })}
              options={toSelectOptions(eligibleTitles)}
              placeholder={g.genderId != null ? 'Select title' : 'Select gender first'}
            />
            <TextField
              id="firstname"
              label="First name"
              required
              value={g.firstname ?? ''}
              onChange={(v) => onDraftChange({ firstname: v })}
              autoComplete="given-name"
              error={errors.firstname}
            />
            <TextField
              id="middlename"
              label="Middle name"
              optional
              value={g.middlename ?? ''}
              onChange={(v) => onDraftChange({ middlename: v })}
              autoComplete="additional-name"
            />
            <TextField
              id="lastname"
              label="Last name"
              required
              value={g.lastname ?? ''}
              onChange={(v) => onDraftChange({ lastname: v })}
              autoComplete="family-name"
              error={errors.lastname}
            />
          </>
        )}

        {isPerson ? (
          <SelectField
            id="nationalityCountryId"
            label="Nationality"
            optional
            value={g.nationalityCountryId ? String(g.nationalityCountryId) : undefined}
            onValueChange={(v) =>
              onDraftChange({ nationalityCountryId: v ? Number(v) : undefined })
            }
            options={toSelectOptions(template.nationalityOptions)}
            placeholder="Select nationality"
          />
        ) : null}

        <DateField
          id="dateOfBirth"
          label={isPerson ? 'Date of birth' : 'Incorporation date'}
          required
          value={g.dateOfBirth}
          onChange={(v) => onDraftChange({ dateOfBirth: v })}
          error={errors.dateOfBirth}
        />

        {legalFormId === LEGAL_FORM_ENTITY ? (
          <>
            <SelectField
              id="constitutionId"
              label="Constitution"
              required
              value={nonPerson.constitutionId ? String(nonPerson.constitutionId) : undefined}
              onValueChange={(v) =>
                onDraftChange({
                  clientNonPersonDetails: { ...nonPerson, constitutionId: Number(v) }
                })
              }
              options={toSelectOptions(template.clientNonPersonConstitutionOptions)}
              placeholder="Select constitution"
              error={errors.constitutionId}
            />
            <SelectField
              id="mainBusinessLineId"
              label="Main business line"
              optional
              value={
                nonPerson.mainBusinessLineId ? String(nonPerson.mainBusinessLineId) : undefined
              }
              onValueChange={(v) =>
                onDraftChange({
                  clientNonPersonDetails: {
                    ...nonPerson,
                    mainBusinessLineId: v ? Number(v) : undefined
                  }
                })
              }
              options={toSelectOptions(template.clientNonPersonMainBusinessLineOptions)}
              placeholder="Select business line"
            />
            <DateField
              id="incorpValidityTillDate"
              label="Incorporation validity till"
              optional
              allowFuture
              value={nonPerson.incorpValidityTillDate}
              onChange={(v) =>
                onDraftChange({
                  clientNonPersonDetails: { ...nonPerson, incorpValidityTillDate: v }
                })
              }
            />
            <TextField
              id="incorpNumber"
              label="Incorporation number"
              optional
              value={nonPerson.incorpNumber ?? ''}
              onChange={(v) =>
                onDraftChange({
                  clientNonPersonDetails: { ...nonPerson, incorpNumber: v }
                })
              }
            />
            <TextField
              id="remarks"
              className="sm:col-span-2"
              label="Remarks"
              optional
              multiline
              value={nonPerson.remarks ?? ''}
              onChange={(v) =>
                onDraftChange({
                  clientNonPersonDetails: { ...nonPerson, remarks: v }
                })
              }
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
