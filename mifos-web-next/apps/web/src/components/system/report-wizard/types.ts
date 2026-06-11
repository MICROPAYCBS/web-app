/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportAllowedParameter,
  FineractReportDetail,
  FineractReportTemplate
} from '@mifos/api-client';
import type { UpsertReportFormInput } from '@mifos/validation';
import type { ReportParameterRow } from '@/components/system/report-parameters-editor';

export type StepErrors = Record<string, string>;

export type ReportWizardDraft = {
  form: UpsertReportFormInput;
  parameters: ReportParameterRow[];
};

export type ReportStepProps = {
  draft: ReportWizardDraft;
  errors: StepErrors;
  disabled?: boolean;
  allowedReportTypes: string[];
  allowedReportSubTypes: string[];
  allowedParameters: FineractReportAllowedParameter[];
  fieldsLocked?: boolean;
  onFormChange: (patch: Partial<UpsertReportFormInput>) => void;
  onParametersChange: (parameters: ReportParameterRow[]) => void;
  onReportTypeChange: (reportType: string | undefined) => void;
};

export type ReportWizardProps = {
  mode: 'create' | 'edit';
  reportId?: number;
  template: FineractReportTemplate;
  report?: FineractReportDetail;
  initialDraft: ReportWizardDraft;
};
