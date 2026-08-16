/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractSchedulerJobRunHistory {
  version?: number;
  jobRunStartTime?: string | number[];
  jobRunEndTime?: string | number[];
  status?: string;
  triggerType?: string;
  jobRunErrorLog?: string;
  jobRunErrorMessage?: string;
}

export interface FineractSchedulerJob {
  jobId: number;
  displayName: string;
  /** Present on Micropay / some Fineract builds; used by job-sequence step editors. */
  shortName?: string;
  /** Operator-facing summary of what the job does (max 500). */
  description?: string | null;
  cronExpression: string;
  active: boolean;
  currentlyRunning: boolean;
  nextRunTime?: string | number[];
  lastRunHistory?: FineractSchedulerJobRunHistory;
}

export interface FineractSchedulerStatus {
  active: boolean;
}

export interface FineractSchedulerJobHistoryPage {
  pageItems: FineractSchedulerJobRunHistory[];
}

export interface FineractJobParameter {
  parameterName: string;
  parameterValue: string;
}

export interface FineractWorkflowJobNames {
  businessJobs: string[];
}

export interface FineractWorkflowJobStep {
  stepName: string;
  stepDescription?: string;
  order: number;
}

export interface FineractWorkflowJobSteps {
  businessSteps: FineractWorkflowJobStep[];
}

export interface FineractAvailableWorkflowStep {
  stepName: string;
  stepDescription?: string;
}

export interface FineractAvailableWorkflowSteps {
  availableBusinessSteps: FineractAvailableWorkflowStep[];
}

export interface FineractCobCatchUpStatus {
  isCatchUpRunning: boolean;
}

export interface FineractLockedLoan {
  loanId: number;
  lockPlacedOn?: string | number[];
  lockOwner?: string;
  error?: string;
  stacktrace?: string;
}

export interface FineractLockedLoansPage {
  content: FineractLockedLoan[];
  totalElements?: number;
}
