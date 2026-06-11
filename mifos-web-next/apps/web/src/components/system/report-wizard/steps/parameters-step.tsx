'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ReportParametersEditor } from '@/components/system/report-parameters-editor';
import { Card, CardContent } from '@/components/ui/card';
import type { ReportStepProps } from '../types';

export function ReportParametersStep({
  draft,
  errors,
  disabled,
  allowedParameters,
  onParametersChange
}: ReportStepProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <ReportParametersEditor
          parameters={draft.parameters}
          allowedParameters={allowedParameters}
          disabled={disabled}
          onChange={onParametersChange}
          error={errors.reportParameters}
        />
      </CardContent>
    </Card>
  );
}
