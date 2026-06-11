'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import { isSubTypeEnabledForReportType, REPORT_CATEGORIES } from '@/lib/fineract/report-display';
import type { ReportStepProps } from '../types';

export function ReportDetailsStep({
  draft,
  errors,
  disabled,
  allowedReportTypes,
  allowedReportSubTypes,
  fieldsLocked,
  onFormChange,
  onReportTypeChange
}: ReportStepProps) {
  const { form } = draft;
  const subTypeEnabled = !fieldsLocked && isSubTypeEnabledForReportType(form.reportType);

  const reportTypeOptions = allowedReportTypes.map((type) => ({
    value: type,
    label: type
  }));
  const reportSubTypeOptions = allowedReportSubTypes.map((type) => ({
    value: type,
    label: type
  }));
  const categoryOptions = [
    { value: '', label: 'None' },
    ...REPORT_CATEGORIES.map((category) => ({
      value: category,
      label: category
    }))
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic details</CardTitle>
        <CardDescription>Name, type, category, and visibility for this report definition.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TextField
          label="Report name"
          required
          value={form.reportName}
          onChange={(value) => onFormChange({ reportName: value })}
          disabled={fieldsLocked || disabled}
          error={errors.reportName}
          placeholder="e.g. Active loans listing"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Report type"
            required
            value={form.reportType}
            onValueChange={onReportTypeChange}
            options={reportTypeOptions}
            disabled={fieldsLocked || disabled}
            error={errors.reportType}
            placeholder="Select report type"
          />

          {subTypeEnabled ? (
            <SelectField
              label="Report sub-type"
              required
              value={form.reportSubType ?? ''}
              onValueChange={(value) => onFormChange({ reportSubType: value ?? '' })}
              options={reportSubTypeOptions}
              disabled={disabled}
              error={errors.reportSubType}
              placeholder="Select sub-type"
            />
          ) : null}

          <SelectField
            label="Category"
            value={form.reportCategory ?? ''}
            onValueChange={(value) =>
              onFormChange({ reportCategory: (value ?? '') as typeof form.reportCategory })
            }
            options={categoryOptions}
            disabled={fieldsLocked || disabled}
            placeholder="Select category"
          />
        </div>

        <TextField
          label="Description"
          optional
          multiline
          rows={3}
          value={form.description ?? ''}
          onChange={(value) => onFormChange({ description: value })}
          disabled={disabled}
          error={errors.description}
          placeholder="Brief description of the report purpose"
        />

        <Field orientation="horizontal" className="items-start gap-3 rounded-lg border border-border p-4">
          <Checkbox
            checked={form.useReport}
            onCheckedChange={(checked) => onFormChange({ useReport: checked === true })}
            disabled={disabled}
          />
          <FieldContent>
            <FieldLabel>Show in user reports menu</FieldLabel>
            <FieldDescription>
              When enabled, users can find and run this report from the reports catalog.
            </FieldDescription>
          </FieldContent>
        </Field>
      </CardContent>
    </Card>
  );
}
