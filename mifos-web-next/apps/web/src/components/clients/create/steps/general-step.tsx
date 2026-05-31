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
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { FormLabel } from '@/components/composites/form-label';
import { Label } from '@/components/ui/label';
import { toFineractDate } from '@/lib/fineract/dates';
import { toSelectOptions } from '@/lib/form/select-options';
import type { ClientGeneralFormState, CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

export interface GeneralStepProps {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  errors: StepErrors;
  onDraftChange: (patch: Partial<ClientGeneralFormState>) => void;
  onTemplateChange: (template: FineractClientTemplate) => void;
  onNext: () => void;
}

export function GeneralStep({
  template,
  draft,
  errors,
  onDraftChange,
  onTemplateChange,
  onNext
}: GeneralStepProps) {
  const g = draft.general;
  const legalFormId = g.legalFormId ?? LEGAL_FORM_PERSON;
  const active = g.active ?? false;
  const addSavings = g.addSavings ?? false;
  const nonPerson = g.clientNonPersonDetails ?? {};


  async function reloadTemplateForOffice(officeId: number) {
    const res = await fetch(`/api/clients/template?officeId=${officeId}`);
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as FineractClientTemplate;
    if (data?.staffOptions) {
      onTemplateChange({ ...template, ...data, officeOptions: template.officeOptions });
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
      {errors._form ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors._form}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="officeId"
          label="Office"
          required
          value={g.officeId ? String(g.officeId) : undefined}
          onValueChange={(v) => {
            const id = Number(v);
            onDraftChange({ officeId: id });
            void reloadTemplateForOffice(id);
          }}
          options={toSelectOptions(template.officeOptions)}
          placeholder="Select office"
          error={errors.officeId}
        />

        <SelectField
          id="legalFormId"
          label="Legal form"
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
                clientNonPersonDetails: { constitutionId: nonPerson.constitutionId }
              });
            }
          }}
          options={legalFormOptions}
          error={errors.legalFormId}
        />

        <TextField
          id="externalId"
          className="sm:col-span-2"
          label="External ID"
          optional
          value={g.externalId ?? ''}
          onChange={(v) => onDraftChange({ externalId: v })}
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

        <DateField
          id="dateOfBirth"
          label={legalFormId === LEGAL_FORM_PERSON ? 'Date of birth' : 'Incorporation date'}
          optional
          value={g.dateOfBirth}
          onChange={(v) => onDraftChange({ dateOfBirth: v })}
        />

        {legalFormId === LEGAL_FORM_PERSON ? (
          <SelectField
            id="genderId"
            label="Gender"
            optional
            value={g.genderId ? String(g.genderId) : undefined}
            onValueChange={(v) => onDraftChange({ genderId: v ? Number(v) : undefined })}
            options={toSelectOptions(template.genderOptions)}
            placeholder="Select gender"
          />
        ) : null}

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
              value={nonPerson.mainBusinessLineId ? String(nonPerson.mainBusinessLineId) : undefined}
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

        <SelectField
          id="staffId"
          label="Staff"
          optional
          value={g.staffId ? String(g.staffId) : undefined}
          onValueChange={(v) => onDraftChange({ staffId: v ? Number(v) : undefined })}
          options={toSelectOptions(
            template.staffOptions?.map((s) => ({
              id: s.id,
              displayName:
                s.displayName ?? (`${s.firstname ?? ''} ${s.lastname ?? ''}`.trim() || `Staff ${s.id}`)
            }))
          )}
          placeholder="Assign staff"
        />

        {legalFormId === LEGAL_FORM_PERSON ? (
          <Field className="flex flex-row items-center gap-2 self-end">
            <Checkbox
              id="isStaff"
              checked={g.isStaff ?? false}
              onCheckedChange={(checked) => onDraftChange({ isStaff: checked === true })}
            />
            <Label htmlFor="isStaff" className="font-normal">
              Is staff <span className="text-muted-foreground">(optional)</span>
            </Label>
          </Field>
        ) : (
          <div className="hidden sm:block" />
        )}

        <TextField
          id="mobileNo"
          label="Mobile"
          optional
          value={g.mobileNo ?? ''}
          onChange={(v) => onDraftChange({ mobileNo: v })}
        />

        <TextField
          id="emailAddress"
          label="Email"
          optional
          type="email"
          value={g.emailAddress ?? ''}
          onChange={(v) => onDraftChange({ emailAddress: v })}
          error={errors.emailAddress}
        />

        <SelectField
          id="clientTypeId"
          label="Client type"
          optional
          value={g.clientTypeId ? String(g.clientTypeId) : undefined}
          onValueChange={(v) => onDraftChange({ clientTypeId: v ? Number(v) : undefined })}
          options={toSelectOptions(template.clientTypeOptions)}
          placeholder="Select client type"
        />

        <SelectField
          id="clientClassificationId"
          label="Client classification"
          optional
          value={g.clientClassificationId ? String(g.clientClassificationId) : undefined}
          onValueChange={(v) =>
            onDraftChange({ clientClassificationId: v ? Number(v) : undefined })
          }
          options={toSelectOptions(template.clientClassificationOptions)}
          placeholder="Select classification"
        />

        <DateField
          id="submittedOnDate"
          label="Submitted on"
          required
          value={g.submittedOnDate}
          onChange={(v) => onDraftChange({ submittedOnDate: v ?? '' })}
          error={errors.submittedOnDate}
        />

        <Field className="flex flex-row items-center gap-2 self-end">
          <Checkbox
            id="active"
            checked={active}
            onCheckedChange={(checked) => {
              const isActive = checked === true;
              onDraftChange({
                active: isActive,
                activationDate: isActive && !g.activationDate ? toFineractDate() : g.activationDate
              });
            }}
          />
          <FormLabel htmlFor="active" optional className="font-normal">
            Active
          </FormLabel>
        </Field>

        {active ? (
          <DateField
            id="activationDate"
            label="Activation date"
            required
            value={g.activationDate}
            onChange={(v) => onDraftChange({ activationDate: v })}
            error={errors.activationDate}
          />
        ) : (
          <div className="hidden sm:block" />
        )}

        <Field className="flex flex-row items-center gap-2 self-end">
          <Checkbox
            id="addSavings"
            checked={addSavings}
            onCheckedChange={(checked) => {
              const open = checked === true;
              onDraftChange({
                addSavings: open,
                savingsProductId: open ? g.savingsProductId : undefined
              });
            }}
          />
          <FormLabel htmlFor="addSavings" optional className="font-normal">
            Open savings account
          </FormLabel>
        </Field>

        {addSavings ? (
          <SelectField
            id="savingsProductId"
            label="Savings product"
            required
            value={g.savingsProductId ? String(g.savingsProductId) : undefined}
            onValueChange={(v) => onDraftChange({ savingsProductId: Number(v) })}
            options={toSelectOptions(
              template.savingProductOptions?.map((p) => ({ id: p.id, name: p.name }))
            )}
            placeholder="Select savings product"
            error={errors.savingsProductId}
          />
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
