/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export interface CenterListItem {
  id: number;
  name: string;
  accountNo?: string;
  externalId?: string;
  status?: FineractEnumOption;
  officeName?: string;
  active?: boolean;
}

export interface CentersPage {
  totalFilteredRecords: number;
  pageItems: CenterListItem[];
}

export interface CenterGroupOption {
  id: number;
  name: string;
  officeName?: string;
}

export interface CenterStaffOption {
  id: number;
  displayName: string;
}

export interface CenterCreateTemplate {
  staffOptions: CenterStaffOption[];
}

export interface CenterTimeline {
  submittedOnDate?: string | number[];
  activationDate?: string | number[];
}

export interface CenterGroupMember {
  id: number;
  name: string;
  accountNo?: string;
  officeName?: string;
  status?: FineractEnumOption;
  timeline?: CenterTimeline;
}

export interface CenterMeetingCalendar {
  nextTenRecurringDates?: Array<string | number[]>;
}

export interface CenterDetail {
  id: number;
  name: string;
  accountNo?: string;
  externalId?: string;
  officeId?: number;
  officeName?: string;
  staffId?: number;
  staffName?: string;
  status?: FineractEnumOption;
  activationDate?: string | number[];
  timeline?: CenterTimeline;
  groupMembers?: CenterGroupMember[];
  collectionMeetingCalendar?: CenterMeetingCalendar;
}

export interface CenterEditTemplate extends CenterDetail {
  staffOptions: CenterStaffOption[];
}

export interface CenterSummary {
  activeClients?: number;
  activeGroupLoans?: number;
  activeClientLoans?: number;
  overdueGroupLoans?: number;
  activeGroupBorrowers?: number;
  activeClientBorrowers?: number;
  overdueClientLoans?: number;
}

export interface CenterSavingsAccount {
  id: number;
  accountNo?: string;
  productName?: string;
  accountBalance?: number;
  status?: FineractEnumOption & {
    active?: boolean;
    submittedAndPendingApproval?: boolean;
  };
  depositType?: { id: number };
}

export interface CenterMutationResponse {
  resourceId?: number;
  officeId?: number;
}
