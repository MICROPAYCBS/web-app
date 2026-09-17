/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractLoanRescheduleReasonOption {
  id: number;
  name?: string;
  position?: number;
  description?: string;
  active?: boolean;
  mandatory?: boolean;
}

export interface FineractLoanRescheduleRequestStatus {
  id?: number;
  code?: string;
  value?: string;
  pendingApproval?: boolean;
  approved?: boolean;
  rejected?: boolean;
}

export interface FineractLoanRescheduleRequestTimeline {
  submittedOnDate?: string | number[];
  submittedByUsername?: string;
  submittedByFirstname?: string;
  submittedByLastname?: string;
  approvedOnDate?: string | number[];
  approvedByUsername?: string;
  approvedByFirstname?: string;
  approvedByLastname?: string;
  rejectedOnDate?: string | number[];
  rejectedByUsername?: string;
  rejectedByFirstname?: string;
  rejectedByLastname?: string;
}

export interface FineractLoanRescheduleRequest {
  id: number;
  loanId?: number;
  clientId?: number;
  clientName?: string;
  loanAccountNumber?: string;
  statusEnum?: FineractLoanRescheduleRequestStatus;
  rescheduleFromInstallment?: number;
  rescheduleFromDate?: string | number[];
  recalculateInterest?: boolean;
  rescheduleReasonCodeValue?: { id?: number; name?: string };
  timeline?: FineractLoanRescheduleRequestTimeline;
  rescheduleReasonComment?: string;
}

export interface FineractLoanRescheduleTemplate {
  rescheduleReasons?: FineractLoanRescheduleReasonOption[];
}
