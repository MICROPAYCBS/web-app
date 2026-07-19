'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FundMappingAdvanceSearchTemplate } from '@mifos/api-client';
import { Search } from 'lucide-react';
import { useId } from 'react';
import { DateField } from '@/components/composites/date-field';
import { FormLabel } from '@/components/composites/form-label';
import { SelectField } from '@/components/composites/select-field';
import { sanitizeNumericInput } from '@/components/composites/numeric-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { fineractDateToDate, todayStart } from '@/lib/fineract/date-input';
import {
  FUND_MAPPING_COMPARISON_CONDITIONS,
  FUND_MAPPING_LOAN_DATE_OPTIONS,
  FUND_MAPPING_LOAN_STATUS_OPTIONS,
  type FundMappingComparisonCondition
} from '@/lib/fineract/fund-mapping-display';
import { labeledOptionsToSelectOptions } from '@/lib/form/select-options';

const FUND_MAPPING_COMPARISON_SELECT_OPTIONS = labeledOptionsToSelectOptions(
  FUND_MAPPING_COMPARISON_CONDITIONS
);
const FUND_MAPPING_DATE_SELECT_OPTIONS = labeledOptionsToSelectOptions(
  FUND_MAPPING_LOAN_DATE_OPTIONS
);

export type FundMappingSearchForm = {
  loanStatus: string[];
  loanProducts: number[];
  offices: number[];
  loanDateOption: string;
  loanFromDate: string;
  loanToDate: string;
  includeOutStandingAmountPercentage: boolean;
  outStandingAmountPercentageCondition: FundMappingComparisonCondition | '';
  minOutStandingAmountPercentage: string;
  maxOutStandingAmountPercentage: string;
  outStandingAmountPercentage: string;
  includeOutstandingAmount: boolean;
  outstandingAmountCondition: FundMappingComparisonCondition | '';
  minOutstandingAmount: string;
  maxOutstandingAmount: string;
  outstandingAmount: string;
};

export const DEFAULT_FUND_MAPPING_SEARCH: FundMappingSearchForm = {
  loanStatus: [],
  loanProducts: [],
  offices: [],
  loanDateOption: '',
  loanFromDate: '',
  loanToDate: '',
  includeOutStandingAmountPercentage: true,
  outStandingAmountPercentageCondition: 'between',
  minOutStandingAmountPercentage: '',
  maxOutStandingAmountPercentage: '',
  outStandingAmountPercentage: '',
  includeOutstandingAmount: true,
  outstandingAmountCondition: 'between',
  minOutstandingAmount: '',
  maxOutstandingAmount: '',
  outstandingAmount: ''
};

function CheckboxIdList({
  label,
  options,
  value,
  onChange,
  error
}: {
  label: string;
  options: { value: number; label: string }[];
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
}) {
  const selected = new Set(value);

  return (
    <Field>
      <FormLabel>{label}</FormLabel>
      <FieldContent>
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {options.length ? (
            options.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.has(option.value)}
                  onCheckedChange={(next) => {
                    if (next === true) {
                      onChange([...value, option.value]);
                      return;
                    }
                    onChange(value.filter((entry) => entry !== option.value));
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No options available.</p>
          )}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  );
}

function CheckboxStringList({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const selected = new Set(value);

  return (
    <Field>
      <FormLabel>{label}</FormLabel>
      <FieldContent>
        <div className="space-y-2 rounded-lg border border-border p-3">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.has(option.value)}
                onCheckedChange={(next) => {
                  if (next === true) {
                    onChange([...value, option.value]);
                    return;
                  }
                  onChange(value.filter((entry) => entry !== option.value));
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FieldContent>
    </Field>
  );
}

function ComparisonFields({
  idPrefix,
  condition,
  onConditionChange,
  minValue,
  maxValue,
  singleValue,
  onMinChange,
  onMaxChange,
  onSingleChange,
  errors
}: {
  idPrefix: string;
  condition: FundMappingComparisonCondition | '';
  onConditionChange: (value: FundMappingComparisonCondition) => void;
  minValue: string;
  maxValue: string;
  singleValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onSingleChange: (value: string) => void;
  errors?: {
    condition?: string;
    min?: string;
    max?: string;
    single?: string;
  };
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-3">
      <SelectField
        id={`${idPrefix}-condition`}
        label="Comparison condition"
        value={condition || ''}
        onValueChange={(value) =>
          value && onConditionChange(value as FundMappingComparisonCondition)
        }
        options={FUND_MAPPING_COMPARISON_SELECT_OPTIONS}
        placeholder="Select condition"
        error={errors?.condition}
      />

      {condition === 'between' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-min`}>Minimum value</Label>
            <Input
              id={`${idPrefix}-min`}
              inputMode="decimal"
              value={minValue}
              onChange={(event) => onMinChange(sanitizeNumericInput(event.target.value))}
            />
            {errors?.min ? <FieldError>{errors.min}</FieldError> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-max`}>Maximum value</Label>
            <Input
              id={`${idPrefix}-max`}
              inputMode="decimal"
              value={maxValue}
              onChange={(event) => onMaxChange(sanitizeNumericInput(event.target.value))}
            />
            {errors?.max ? <FieldError>{errors.max}</FieldError> : null}
          </div>
        </div>
      ) : condition ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-single`}>Comparison value</Label>
          <Input
            id={`${idPrefix}-single`}
            inputMode="decimal"
            value={singleValue}
            onChange={(event) => onSingleChange(sanitizeNumericInput(event.target.value))}
          />
          {errors?.single ? <FieldError>{errors.single}</FieldError> : null}
        </div>
      ) : null}
    </div>
  );
}

export function FundMappingParameterSheet({
  open,
  onOpenChange,
  template,
  form,
  fieldErrors,
  pending = false,
  onFormChange,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FundMappingAdvanceSearchTemplate;
  form: FundMappingSearchForm;
  fieldErrors?: Record<string, string>;
  pending?: boolean;
  onFormChange: <K extends keyof FundMappingSearchForm>(
    key: K,
    value: FundMappingSearchForm[K]
  ) => void;
  onSubmit: () => void;
}) {
  const formId = useId();
  const loanProductOptions = (template.loanProducts ?? []).map((product) => ({
    value: product.id,
    label: product.name
  }));
  const officeOptions = (template.offices ?? []).map((office) => ({
    value: office.id,
    label: office.name
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>Search parameters</SheetTitle>
          <SheetDescription>
            Filter loans by status, product, branch, dates, and outstanding criteria before viewing
            the summary.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <form
            id={formId}
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <CheckboxStringList
              label="Loan status"
              options={[...FUND_MAPPING_LOAN_STATUS_OPTIONS]}
              value={form.loanStatus}
              onChange={(value) => onFormChange('loanStatus', value)}
            />
            <CheckboxIdList
              label="Loan products"
              options={loanProductOptions}
              value={form.loanProducts}
              onChange={(value) => onFormChange('loanProducts', value)}
            />
            <CheckboxIdList
              label="Branches"
              options={officeOptions}
              value={form.offices}
              onChange={(value) => onFormChange('offices', value)}
              error={fieldErrors?.offices}
            />
            <SelectField
              id="fund-mapping-date-type"
              label="Date type"
              value={form.loanDateOption}
              onValueChange={(value) => onFormChange('loanDateOption', value ?? '')}
              options={FUND_MAPPING_DATE_SELECT_OPTIONS}
              placeholder="Select date type"
              error={fieldErrors?.loanDateOption}
            />
            <DateField
              id="fund-mapping-from-date"
              label="From date"
              required
              value={form.loanFromDate}
              onChange={(value) => onFormChange('loanFromDate', value ?? '')}
              toDate={form.loanToDate ? fineractDateToDate(form.loanToDate) : todayStart()}
              error={fieldErrors?.loanFromDate}
            />
            <DateField
              id="fund-mapping-to-date"
              label="To date"
              required
              value={form.loanToDate}
              onChange={(value) => onFormChange('loanToDate', value ?? '')}
              toDate={todayStart()}
              error={fieldErrors?.loanToDate}
            />

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={form.includeOutStandingAmountPercentage}
                  onCheckedChange={(checked) =>
                    onFormChange('includeOutStandingAmountPercentage', checked === true)
                  }
                />
                Loan outstanding percentage
              </label>
              {form.includeOutStandingAmountPercentage ? (
                <ComparisonFields
                  idPrefix="outstanding-percentage"
                  condition={form.outStandingAmountPercentageCondition}
                  onConditionChange={(value) => {
                    onFormChange('outStandingAmountPercentageCondition', value);
                    if (value === 'between') {
                      onFormChange('outStandingAmountPercentage', '');
                    } else {
                      onFormChange('minOutStandingAmountPercentage', '');
                      onFormChange('maxOutStandingAmountPercentage', '');
                    }
                  }}
                  minValue={form.minOutStandingAmountPercentage}
                  maxValue={form.maxOutStandingAmountPercentage}
                  singleValue={form.outStandingAmountPercentage}
                  onMinChange={(value) => onFormChange('minOutStandingAmountPercentage', value)}
                  onMaxChange={(value) => onFormChange('maxOutStandingAmountPercentage', value)}
                  onSingleChange={(value) => onFormChange('outStandingAmountPercentage', value)}
                  errors={{
                    condition: fieldErrors?.outStandingAmountPercentageCondition,
                    min: fieldErrors?.minOutStandingAmountPercentage,
                    max: fieldErrors?.maxOutStandingAmountPercentage,
                    single: fieldErrors?.outStandingAmountPercentage
                  }}
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={form.includeOutstandingAmount}
                  onCheckedChange={(checked) =>
                    onFormChange('includeOutstandingAmount', checked === true)
                  }
                />
                Loan outstanding amount
              </label>
              {form.includeOutstandingAmount ? (
                <ComparisonFields
                  idPrefix="outstanding-amount"
                  condition={form.outstandingAmountCondition}
                  onConditionChange={(value) => {
                    onFormChange('outstandingAmountCondition', value);
                    if (value === 'between') {
                      onFormChange('outstandingAmount', '');
                    } else {
                      onFormChange('minOutstandingAmount', '');
                      onFormChange('maxOutstandingAmount', '');
                    }
                  }}
                  minValue={form.minOutstandingAmount}
                  maxValue={form.maxOutstandingAmount}
                  singleValue={form.outstandingAmount}
                  onMinChange={(value) => onFormChange('minOutstandingAmount', value)}
                  onMaxChange={(value) => onFormChange('maxOutstandingAmount', value)}
                  onSingleChange={(value) => onFormChange('outstandingAmount', value)}
                  errors={{
                    condition: fieldErrors?.outstandingAmountCondition,
                    min: fieldErrors?.minOutstandingAmount,
                    max: fieldErrors?.maxOutstandingAmount,
                    single: fieldErrors?.outstandingAmount
                  }}
                />
              ) : null}
            </div>
          </form>
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Close
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            <Search className="mr-2 size-4" />
            {pending ? 'Searching…' : 'View summary'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
