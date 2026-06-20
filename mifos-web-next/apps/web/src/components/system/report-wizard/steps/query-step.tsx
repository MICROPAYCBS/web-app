'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TextField } from '@/components/composites/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportStepProps } from '../types';

export function ReportQueryStep({ draft, errors, disabled, onFormChange }: ReportStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Query configuration</CardTitle>
        <CardDescription>
          SQL executed when the report runs. Reference parameters with their catalog placeholder,
          for example <code className="text-xs">${'{officeId}'}</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TextField
          label="Report SQL"
          required
          multiline
          rows={14}
          value={draft.form.reportSql ?? ''}
          onChange={(value) => onFormChange({ reportSql: value })}
          disabled={disabled}
          error={errors.reportSql}
          placeholder="SELECT … FROM … WHERE …"
          className="font-mono text-xs"
        />
      </CardContent>
    </Card>
  );
}
