'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanAccountSecurityStepInput, LoanCollateralItemInput, LoanGuarantorItemInput } from '@mifos/validation';
import { Plus, Trash2 } from 'lucide-react';
import { DetailSection, EmptyState } from '@/components/composites';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanAccountStepErrors } from '../validation';

const GUARANTOR_TYPE_OPTIONS = [
  { value: '1', label: 'Existing client', keywords: ['client'] },
  { value: '3', label: 'Staff', keywords: ['staff'] },
  { value: '4', label: 'External entity', keywords: ['external'] }
];

function emptyCollateralRow(): LoanCollateralItemInput {
  return { collateralTypeId: 0, value: 0, description: '' };
}

function emptyGuarantorRow(): LoanGuarantorItemInput {
  return { guarantorTypeId: 1, entityId: undefined, firstname: '', lastname: '' };
}

export function LoanAccountSecurityStep({
  template,
  draft,
  errors,
  onChange
}: {
  template: ClientLoanAccountTemplate;
  draft: LoanAccountSecurityStepInput;
  errors: LoanAccountStepErrors;
  onChange: (patch: Partial<LoanAccountSecurityStepInput>) => void;
}) {
  const collateralOptions = toSelectOptions(
    template.loanCollateralOptions?.map((option) => ({
      id: option.collateralId,
      name: option.name ?? option.description ?? String(option.collateralId)
    }))
  );

  const collateral = draft.collateral ?? [];
  const guarantors = draft.guarantors ?? [];

  const updateCollateral = (index: number, patch: Partial<LoanCollateralItemInput>) => {
    const next = collateral.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row
    );
    onChange({ collateral: next });
  };

  const updateGuarantor = (index: number, patch: Partial<LoanGuarantorItemInput>) => {
    const next = guarantors.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row
    );
    onChange({ guarantors: next });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Optionally add collateral and guarantors to support this loan application.
      </p>
      <DetailSection title="Collateral">
        {collateral.length === 0 ? (
          <EmptyState
            title="No collateral added"
            description="Add security items backing this loan when required by the product."
            action={
              collateralOptions.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ collateral: [emptyCollateralRow()] })}
                >
                  <Plus className="size-4" />
                  Add collateral
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {collateral.map((row, index) => (
              <div
                key={`collateral-${index}`}
                className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2"
              >
                <SelectField
                  label="Collateral type"
                  required
                  value={row.collateralTypeId > 0 ? String(row.collateralTypeId) : undefined}
                  onValueChange={(value) =>
                    updateCollateral(index, {
                      collateralTypeId: value ? Number(value) : 0
                    })
                  }
                  options={collateralOptions}
                  placeholder="Select collateral"
                  error={errors[`collateral.${index}.collateralTypeId`]}
                />
                <NumericField
                  id={`collateral-value-${index}`}
                  label="Quantity"
                  required
                  value={row.value > 0 ? String(row.value) : ''}
                  onChange={(value) =>
                    updateCollateral(index, { value: value ? Number(value) : 0 })
                  }
                  error={errors[`collateral.${index}.value`]}
                />
                <TextField
                  id={`collateral-description-${index}`}
                  label="Description"
                  optional
                  className="sm:col-span-2"
                  value={row.description ?? ''}
                  onChange={(description) => updateCollateral(index, { description })}
                  error={errors[`collateral.${index}.description`]}
                />
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChange({
                        collateral: collateral.filter((_, rowIndex) => rowIndex !== index)
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {collateralOptions.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ collateral: [...collateral, emptyCollateralRow()] })}
              >
                <Plus className="size-4" />
                Add another
              </Button>
            ) : null}
          </div>
        )}
      </DetailSection>
      <DetailSection title="Guarantors">
        {guarantors.length === 0 ? (
          <EmptyState
            title="No guarantors added"
            description="Add co-signers or financial references when required."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ guarantors: [emptyGuarantorRow()] })}
              >
                <Plus className="size-4" />
                Add guarantor
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {guarantors.map((row, index) => {
              const isExternal = row.guarantorTypeId === 4;
              const needsEntityId = row.guarantorTypeId === 1 || row.guarantorTypeId === 3;
              return (
                <div
                  key={`guarantor-${index}`}
                  className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2"
                >
                  <SelectField
                    label="Guarantor type"
                    required
                    value={String(row.guarantorTypeId)}
                    onValueChange={(value) =>
                      updateGuarantor(index, {
                        guarantorTypeId: value ? Number(value) : 1,
                        entityId: undefined,
                        firstname: '',
                        lastname: ''
                      })
                    }
                    options={GUARANTOR_TYPE_OPTIONS}
                    error={errors[`guarantors.${index}.guarantorTypeId`]}
                  />
                  {needsEntityId ? (
                    <NumericField
                      id={`guarantor-entity-${index}`}
                      label={row.guarantorTypeId === 3 ? 'Staff ID' : 'Client ID'}
                      required
                      integer
                      value={row.entityId ? String(row.entityId) : ''}
                      onChange={(value) =>
                        updateGuarantor(index, {
                          entityId: value ? Number(value) : undefined
                        })
                      }
                      error={errors[`guarantors.${index}.entityId`]}
                    />
                  ) : null}
                  {isExternal ? (
                    <>
                      <TextField
                        id={`guarantor-firstname-${index}`}
                        label="First name"
                        required
                        value={row.firstname ?? ''}
                        onChange={(firstname) => updateGuarantor(index, { firstname })}
                        error={errors[`guarantors.${index}.firstname`]}
                      />
                      <TextField
                        id={`guarantor-lastname-${index}`}
                        label="Last name"
                        required
                        value={row.lastname ?? ''}
                        onChange={(lastname) => updateGuarantor(index, { lastname })}
                        error={errors[`guarantors.${index}.lastname`]}
                      />
                    </>
                  ) : null}
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onChange({
                          guarantors: guarantors.filter((_, rowIndex) => rowIndex !== index)
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ guarantors: [...guarantors, emptyGuarantorRow()] })}
            >
              <Plus className="size-4" />
              Add another
            </Button>
          </div>
        )}
      </DetailSection>
    </div>
  );
}
