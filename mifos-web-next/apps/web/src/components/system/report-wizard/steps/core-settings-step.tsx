'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailField, DetailFieldGrid } from '@/components/composites';
import { TextField } from '@/components/composites/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import { formatReportCategory } from '@/lib/fineract/report-display';
import type { ReportStepProps } from '../types';

export function ReportCoreSettingsStep({
  draft,
  errors,
  disabled,
  onFormChange,
  reportType,
  reportCategory
}: ReportStepProps & {
  reportType?: string;
  reportCategory?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Core report settings</CardTitle>
        <CardDescription>
          Built-in reports only allow updating the user menu flag and description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <DetailFieldGrid columns={2}>
          <DetailField label="Report type">{reportType ?? '—'}</DetailField>
          <DetailField label="Category">{formatReportCategory(reportCategory)}</DetailField>
        </DetailFieldGrid>

        <Field orientation="horizontal" className="items-start gap-3 rounded-lg border border-border p-4">
          <Checkbox
            checked={draft.form.useReport}
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

        <TextField
          label="Description"
          optional
          multiline
          rows={3}
          value={draft.form.description ?? ''}
          onChange={(value) => onFormChange({ description: value })}
          disabled={disabled}
          error={errors.description}
        />
      </CardContent>
    </Card>
  );
}
