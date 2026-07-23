/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type JobSequenceStepType = 'SCHEDULER_JOB' | 'OPERATION';

export type JobSequenceRunStatus =
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  /** Scheduler job step skipped because the target job is missing or inactive. */
  | 'SKIPPED';

export type JobSequenceOperationCode = 'ADVANCE_BUSINESS_DATE';

export interface FineractJobSequenceStep {
  id?: number;
  stepOrder: number;
  stepType: JobSequenceStepType;
  jobShortName?: string | null;
  operationCode?: string | null;
  enabled: boolean;
  stopOnFailure: boolean;
}

export interface FineractJobSequence {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
  steps: FineractJobSequenceStep[];
}

export interface FineractJobSequenceWritePayload {
  name: string;
  description?: string | null;
  active?: boolean;
  steps: Array<{
    stepOrder: number;
    stepType: JobSequenceStepType;
    jobShortName?: string;
    operationCode?: string;
    enabled?: boolean;
    stopOnFailure?: boolean;
  }>;
}

export interface FineractJobSequenceRunStep {
  id: number;
  stepOrder: number;
  stepType: JobSequenceStepType;
  operationCode?: string | null;
  jobShortName?: string | null;
  status: JobSequenceRunStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  schedulerJobId?: number | null;
  errorMessage?: string | null;
}

export interface FineractJobSequenceRun {
  id: number;
  sequenceId: number;
  sequenceName: string;
  triggeredByUserId?: number | null;
  status: JobSequenceRunStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  steps: FineractJobSequenceRunStep[];
}

export interface FineractJobSequenceExecuteResponse {
  resourceId?: number;
  subResourceId?: number;
  officeId?: number;
  clientId?: number;
  groupId?: number;
  loanId?: number;
  savingsId?: number;
}
