/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';
import type { CenterSavingsAccount, CenterStaffOption, CenterSummary, CenterTimeline } from '../centers/types';

export interface GroupListItem {
  id: number;
  name: string;
  accountNo?: string;
  externalId?: string;
  status?: FineractEnumOption;
  officeName?: string;
  active?: boolean;
}

export interface GroupsPage {
  totalFilteredRecords: number;
  pageItems: GroupListItem[];
}

export interface GroupClientOption {
  id: number;
  displayName: string;
  accountNo?: string;
  officeName?: string;
}

export interface GroupCreateTemplate {
  staffOptions: CenterStaffOption[];
}

export interface GroupClientMember {
  id: number;
  displayName?: string;
  accountNo?: string;
  officeName?: string;
  status?: FineractEnumOption;
  timeline?: CenterTimeline;
}

export interface GroupDetail {
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
  clientMembers?: GroupClientMember[];
}

export interface GroupEditTemplate extends GroupDetail {
  staffOptions: CenterStaffOption[];
}

export type GroupSummary = CenterSummary;

export type GroupSavingsAccount = CenterSavingsAccount;

export interface GroupLoanAccount {
  id: number;
  accountNo?: string;
  productName?: string;
  loanBalance?: number;
  originalLoan?: number;
  status?: FineractEnumOption;
}

export interface GroupAccounts {
  savingsAccounts: GroupSavingsAccount[];
  loanAccounts: GroupLoanAccount[];
}

export interface GroupMutationResponse {
  resourceId?: number;
  officeId?: number;
}
