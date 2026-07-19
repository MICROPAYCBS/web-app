/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export interface SmsCampaignBusinessRule {
  reportId: number;
  reportName: string;
  reportSubType?: string;
}

export interface SmsCampaignTimeline {
  submittedOnDate?: number[] | string;
  submittedByUsername?: string;
  activatedOnDate?: number[] | string;
  closedOnDate?: number[] | string;
}

export interface SmsCampaignListItem {
  id: number;
  campaignName: string;
  campaignMessage?: string;
  campaignType?: FineractEnumOption;
  triggerType?: FineractEnumOption;
  campaignStatus?: FineractEnumOption;
  smsCampaignTimeLine?: SmsCampaignTimeline;
}

export interface SmsCampaignListPage {
  pageItems: SmsCampaignListItem[];
  totalFilteredRecords?: number;
}

export interface SmsCampaignDetail {
  id: number;
  campaignName: string;
  campaignMessage: string;
  campaignType?: FineractEnumOption;
  triggerType?: FineractEnumOption;
  campaignStatus?: FineractEnumOption;
  reportName?: string;
  runReportId?: number;
  providerId?: number | null;
  isNotification?: boolean;
  paramValue?: string;
  recurrence?: string;
  recurrenceStartDate?: number[] | string;
  frequency?: number;
  interval?: number;
  repeatsOnDay?: number | string;
  smsCampaignTimeLine?: SmsCampaignTimeline;
}

export interface SmsCampaignTemplate {
  triggerTypeOptions: FineractEnumOption[];
  smsProviderOptions: FineractEnumOption[];
  businessRulesOptions: SmsCampaignBusinessRule[];
}

export interface SmsCampaignMessageByStatusItem {
  message?: string;
  status?: FineractEnumOption;
  mobileNo?: string;
  campaignName?: string;
}

export interface SmsCampaignMessageByStatusPage {
  pageItems: SmsCampaignMessageByStatusItem[];
  totalFilteredRecords?: number;
}

export interface SmsCampaignMutationResponse {
  resourceId?: number;
}
