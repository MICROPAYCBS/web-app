/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportRunColumnHeader,
  FineractReportRunParameterMetadata,
  SmsCampaignTemplate
} from '@mifos/api-client';

export interface SmsCampaignWizardDraft {
  campaignName: string;
  triggerType: number | '';
  runReportId: number | '';
  reportName: string;
  isNotification: boolean;
  providerId: number | '';
  recurrenceStartDate: string;
  frequency: number | '';
  interval: number | '';
  repeatsOnDay: number | '';
  businessRuleValues: Record<string, string>;
  businessRuleMetadata: FineractReportRunParameterMetadata[];
  templateColumns: FineractReportRunColumnHeader[];
  message: string;
}

export interface SmsCampaignWizardProps {
  template: SmsCampaignTemplate;
}

export function createEmptySmsCampaignDraft(): SmsCampaignWizardDraft {
  return {
    campaignName: '',
    triggerType: '',
    runReportId: '',
    reportName: '',
    isNotification: false,
    providerId: '',
    recurrenceStartDate: '',
    frequency: '',
    interval: '',
    repeatsOnDay: '',
    businessRuleValues: {},
    businessRuleMetadata: [],
    templateColumns: [],
    message: ''
  };
}
