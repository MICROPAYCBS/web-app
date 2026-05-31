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
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, toFineractDate } from '@/lib/fineract/dates';
import { fineractDateToIso, isoDateToFineract } from '@/lib/fineract/date-input';
import type { ClientGeneralFormState, CreateClientDraft } from '../types';

export interface GeneralStepProps {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  onDraftChange: (patch: Partial<ClientGeneralFormState>) => void;
  onTemplateChange: (template: FineractClientTemplate) => void;
  onNext: () => void;
}

export function GeneralStep({
  template,
  draft,
  onDraftChange,
  onTemplateChange,
  onNext
}: GeneralStepProps) {
  const g = draft.general;
  const legalFormId = g.legalFormId ?? LEGAL_FORM_PERSON;
  const active = g.active ?? false;
  const addSavings = g.addSavings ?? false;
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (g.legalFormId == null) {
      onDraftChange({
        legalFormId: LEGAL_FORM_PERSON,
        submittedOnDate: g.submittedOnDate ?? toFineractDate(),
        dateFormat: FINERACT_DATE_FORMAT,
        locale: FINERACT_LOCALE
      });
    }
  }, [g.legalFormId, g.submittedOnDate, onDraftChange]);

  async function reloadTemplateForOffice(officeId: number) {
    const res = await fetch(`/api/clients/template?officeId=${officeId}`);
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as FineractClientTemplate;
    if (data?.officeOptions || data?.staffOptions) {
      onTemplateChange({ ...template, ...data, officeOptions: template.officeOptions });
    }
  }

  function setField<K extends keyof ClientGeneralFormState>(
    key: K,
    value: ClientGeneralFormState[K]
  ) {
    onDraftChange({ [key]: value });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!g.officeId) {
      next.officeId = 'Office is required';
    }
    if (!g.submittedOnDate) {
      next.submittedOnDate = 'Submitted on is required';
    }
    if (active && !g.activationDate) {
      next.activationDate = 'Activation date is required when active';
    }
    if (addSavings && !g.savingsProductId) {
      next.savingsProductId = 'Savings product is required';
    }
    if (legalFormId === LEGAL_FORM_PERSON) {
      if (!g.firstname?.trim()) {
        next.firstname = 'First name is required';
      }
      if (!g.lastname?.trim()) {
        next.lastname = 'Last name is required';
      }
    } else {
      if (!g.fullname?.trim()) {
        next.fullname = 'Entity name is required';
      }
      if (!g.clientNonPersonDetails?.constitutionId) {
        next.constitutionId = 'Constitution is required';
      }
    }
    if (g.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.emailAddress)) {
      next.emailAddress = 'Email is not valid';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleNext() {
    if (validate()) {
      onNext();
    }
  }

  const nonPerson = g.clientNonPersonDetails ?? {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="officeId">Office</Label>
          <Select
            value={g.officeId ? String(g.officeId) : ''}
            onValueChange={(v) => {
              const id = Number(v);
              setField('officeId', id);
              void reloadTemplateForOffice(id);
            }}
          >
            <SelectTrigger id="officeId">
              <SelectValue placeholder="Select office" />
            </SelectTrigger>
            <SelectContent>
              {template.officeOptions.map((office) => (
                <SelectItem key={office.id} value={String(office.id)}>
                  {office.nameDecorated ?? office.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.officeId ? <p className="text-xs text-destructive">{errors.officeId}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="legalFormId">Legal form</Label>
          <Select
            value={String(legalFormId)}
            onValueChange={(v) => {
              const id = Number(v);
              setField('legalFormId', id);
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
                  clientNonPersonDetails: nonPerson.constitutionId
                    ? nonPerson
                    : { constitutionId: undefined as unknown as number }
                });
              }
            }}
          >
            <SelectTrigger id="legalFormId">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {template.clientLegalFormOptions?.map((opt) => (
                <SelectItem key={opt.id} value={String(opt.id)}>
                  {opt.value ?? opt.name ?? String(opt.id)}
                </SelectItem>
              )) ?? (
                <>
                  <SelectItem value={String(LEGAL_FORM_PERSON)}>Person</SelectItem>
                  <SelectItem value={String(LEGAL_FORM_ENTITY)}>Entity</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="externalId">External ID</Label>
          <Input
            id="externalId"
            value={g.externalId ?? ''}
            onChange={(e) => setField('externalId', e.target.value)}
          />
        </div>

        {legalFormId === LEGAL_FORM_ENTITY ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullname">Entity name</Label>
            <Input
              id="fullname"
              value={g.fullname ?? ''}
              onChange={(e) => setField('fullname', e.target.value)}
            />
            {errors.fullname ? <p className="text-xs text-destructive">{errors.fullname}</p> : null}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="firstname">First name</Label>
              <Input
                id="firstname"
                value={g.firstname ?? ''}
                onChange={(e) => setField('firstname', e.target.value)}
              />
              {errors.firstname ? (
                <p className="text-xs text-destructive">{errors.firstname}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middlename">Middle name</Label>
              <Input
                id="middlename"
                value={g.middlename ?? ''}
                onChange={(e) => setField('middlename', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastname">Last name</Label>
              <Input
                id="lastname"
                value={g.lastname ?? ''}
                onChange={(e) => setField('lastname', e.target.value)}
              />
              {errors.lastname ? (
                <p className="text-xs text-destructive">{errors.lastname}</p>
              ) : null}
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">
            {legalFormId === LEGAL_FORM_PERSON ? 'Date of birth' : 'Incorporation date'}
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={fineractDateToIso(g.dateOfBirth)}
            onChange={(e) =>
              setField(
                'dateOfBirth',
                e.target.value ? isoDateToFineract(e.target.value) : undefined
              )
            }
          />
        </div>

        {legalFormId === LEGAL_FORM_PERSON ? (
          <div className="space-y-2">
            <Label htmlFor="genderId">Gender</Label>
            <Select
              value={g.genderId ? String(g.genderId) : ''}
              onValueChange={(v) => setField('genderId', v ? Number(v) : undefined)}
            >
              <SelectTrigger id="genderId">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {template.genderOptions?.map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    {opt.name ?? opt.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {legalFormId === LEGAL_FORM_ENTITY ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="constitutionId">Constitution</Label>
              <Select
                value={nonPerson.constitutionId ? String(nonPerson.constitutionId) : ''}
                onValueChange={(v) =>
                  onDraftChange({
                    clientNonPersonDetails: {
                      ...nonPerson,
                      constitutionId: Number(v)
                    }
                  })
                }
              >
                <SelectTrigger id="constitutionId">
                  <SelectValue placeholder="Select constitution" />
                </SelectTrigger>
                <SelectContent>
                  {template.clientNonPersonConstitutionOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.constitutionId ? (
                <p className="text-xs text-destructive">{errors.constitutionId}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mainBusinessLineId">Main business line</Label>
              <Select
                value={nonPerson.mainBusinessLineId ? String(nonPerson.mainBusinessLineId) : ''}
                onValueChange={(v) =>
                  onDraftChange({
                    clientNonPersonDetails: {
                      ...nonPerson,
                      mainBusinessLineId: v ? Number(v) : undefined
                    }
                  })
                }
              >
                <SelectTrigger id="mainBusinessLineId">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {template.clientNonPersonMainBusinessLineOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="incorpValidityTillDate">Incorporation validity till</Label>
              <Input
                id="incorpValidityTillDate"
                type="date"
                value={fineractDateToIso(nonPerson.incorpValidityTillDate)}
                onChange={(e) =>
                  onDraftChange({
                    clientNonPersonDetails: {
                      ...nonPerson,
                      incorpValidityTillDate: e.target.value
                        ? isoDateToFineract(e.target.value)
                        : undefined
                    }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incorpNumber">Incorporation number</Label>
              <Input
                id="incorpNumber"
                value={nonPerson.incorpNumber ?? ''}
                onChange={(e) =>
                  onDraftChange({
                    clientNonPersonDetails: {
                      ...nonPerson,
                      incorpNumber: e.target.value
                    }
                  })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                rows={2}
                value={nonPerson.remarks ?? ''}
                onChange={(e) =>
                  onDraftChange({
                    clientNonPersonDetails: { ...nonPerson, remarks: e.target.value }
                  })
                }
              />
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="staffId">Staff</Label>
          <Select
            value={g.staffId ? String(g.staffId) : ''}
            onValueChange={(v) => setField('staffId', v ? Number(v) : undefined)}
          >
            <SelectTrigger id="staffId">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {template.staffOptions?.map((staff) => (
                <SelectItem key={staff.id} value={String(staff.id)}>
                  {staff.displayName ?? `${staff.firstname ?? ''} ${staff.lastname ?? ''}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {legalFormId === LEGAL_FORM_PERSON ? (
          <div className="flex items-center gap-2 self-end">
            <Checkbox
              id="isStaff"
              checked={g.isStaff ?? false}
              onCheckedChange={(checked) => setField('isStaff', checked === true)}
            />
            <Label htmlFor="isStaff">Is staff</Label>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="mobileNo">Mobile</Label>
          <Input
            id="mobileNo"
            value={g.mobileNo ?? ''}
            onChange={(e) => setField('mobileNo', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailAddress">Email</Label>
          <Input
            id="emailAddress"
            type="email"
            value={g.emailAddress ?? ''}
            onChange={(e) => setField('emailAddress', e.target.value)}
          />
          {errors.emailAddress ? (
            <p className="text-xs text-destructive">{errors.emailAddress}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientTypeId">Client type</Label>
          <Select
            value={g.clientTypeId ? String(g.clientTypeId) : ''}
            onValueChange={(v) => setField('clientTypeId', v ? Number(v) : undefined)}
          >
            <SelectTrigger id="clientTypeId">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {template.clientTypeOptions?.map((opt) => (
                <SelectItem key={opt.id} value={String(opt.id)}>
                  {opt.name ?? opt.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientClassificationId">Client classification</Label>
          <Select
            value={g.clientClassificationId ? String(g.clientClassificationId) : ''}
            onValueChange={(v) => setField('clientClassificationId', v ? Number(v) : undefined)}
          >
            <SelectTrigger id="clientClassificationId">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {template.clientClassificationOptions?.map((opt) => (
                <SelectItem key={opt.id} value={String(opt.id)}>
                  {opt.name ?? opt.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="submittedOnDate">Submitted on</Label>
          <Input
            id="submittedOnDate"
            type="date"
            value={fineractDateToIso(g.submittedOnDate)}
            onChange={(e) =>
              setField('submittedOnDate', e.target.value ? isoDateToFineract(e.target.value) : '')
            }
          />
          {errors.submittedOnDate ? (
            <p className="text-xs text-destructive">{errors.submittedOnDate}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="active"
            checked={active}
            onCheckedChange={(checked) => {
              const isActive = checked === true;
              setField('active', isActive);
              if (isActive && !g.activationDate) {
                setField('activationDate', toFineractDate());
              }
            }}
          />
          <Label htmlFor="active">Active</Label>
        </div>

        {active ? (
          <div className="space-y-2">
            <Label htmlFor="activationDate">Activation date</Label>
            <Input
              id="activationDate"
              type="date"
              value={fineractDateToIso(g.activationDate)}
              onChange={(e) =>
                setField(
                  'activationDate',
                  e.target.value ? isoDateToFineract(e.target.value) : undefined
                )
              }
            />
            {errors.activationDate ? (
              <p className="text-xs text-destructive">{errors.activationDate}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Checkbox
            id="addSavings"
            checked={addSavings}
            onCheckedChange={(checked) => {
              const open = checked === true;
              setField('addSavings', open);
              if (!open) {
                setField('savingsProductId', undefined);
              }
            }}
          />
          <Label htmlFor="addSavings">Open savings account</Label>
        </div>

        {addSavings ? (
          <div className="space-y-2">
            <Label htmlFor="savingsProductId">Savings product</Label>
            <Select
              value={g.savingsProductId ? String(g.savingsProductId) : ''}
              onValueChange={(v) => setField('savingsProductId', Number(v))}
            >
              <SelectTrigger id="savingsProductId">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {template.savingProductOptions?.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.savingsProductId ? (
              <p className="text-xs text-destructive">{errors.savingsProductId}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
