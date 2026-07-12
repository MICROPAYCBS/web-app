'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ReportSqlField } from '@/components/system/report-wizard/report-sql-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportStepProps } from '../types';

export function ReportQueryStep({
  draft,
  errors,
  disabled,
  onFormChange,
  readOnly = false
}: ReportStepProps & { readOnly?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Query configuration</CardTitle>
        <CardDescription>
          {readOnly
            ? 'SQL executed when the report runs. Core reports cannot be edited here.'
            : (
                <>
                  SQL executed when the report runs. Reference parameters with their catalog
                  placeholder, for example <code className="text-xs">${'{officeId}'}</code>.
                </>
              )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReportSqlField
          value={draft.form.reportSql ?? ''}
          onChange={readOnly ? undefined : (value) => onFormChange({ reportSql: value })}
          readOnly={readOnly}
          disabled={disabled}
          error={errors.reportSql}
        />
      </CardContent>
    </Card>
  );
}
