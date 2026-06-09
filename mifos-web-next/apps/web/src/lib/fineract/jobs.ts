import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAvailableWorkflowSteps,
  FineractSchedulerJob,
  FineractSchedulerJobHistoryPage,
  FineractSchedulerStatus,
  FineractWorkflowJobNames,
  FineractWorkflowJobSteps
} from '@mifos/api-client';
import type {
  RunJobWithParametersInput,
  UpdateSchedulerJobInput,
  UpdateWorkflowJobStepsInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const JOBS_PATH = '/jobs';
const SCHEDULER_PATH = '/scheduler';

function normalizeRunHistory(raw: unknown): FineractSchedulerJob['lastRunHistory'] {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  return {
    version: Number.isFinite(Number(row.version)) ? Number(row.version) : undefined,
    jobRunStartTime:
      typeof row.jobRunStartTime === 'string' || Array.isArray(row.jobRunStartTime)
        ? (row.jobRunStartTime as string | number[])
        : undefined,
    jobRunEndTime:
      typeof row.jobRunEndTime === 'string' || Array.isArray(row.jobRunEndTime)
        ? (row.jobRunEndTime as string | number[])
        : undefined,
    status: typeof row.status === 'string' ? row.status : undefined,
    triggerType: typeof row.triggerType === 'string' ? row.triggerType : undefined,
    jobRunErrorLog: typeof row.jobRunErrorLog === 'string' ? row.jobRunErrorLog : undefined,
    jobRunErrorMessage: typeof row.jobRunErrorMessage === 'string' ? row.jobRunErrorMessage : undefined
  };
}

function normalizeSchedulerJob(raw: unknown): FineractSchedulerJob | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const jobId = Number(row.jobId);
  const displayName = typeof row.displayName === 'string' ? row.displayName : '';
  const cronExpression = typeof row.cronExpression === 'string' ? row.cronExpression : '';
  if (!Number.isFinite(jobId) || !displayName) {
    return null;
  }
  return {
    jobId,
    displayName,
    cronExpression,
    active: row.active === true,
    currentlyRunning: row.currentlyRunning === true,
    nextRunTime:
      typeof row.nextRunTime === 'string' || Array.isArray(row.nextRunTime)
        ? (row.nextRunTime as string | number[])
        : undefined,
    lastRunHistory: normalizeRunHistory(row.lastRunHistory)
  };
}

export async function listSchedulerJobs(): Promise<FineractSchedulerJob[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(JOBS_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeSchedulerJob(item))
    .filter((item): item is FineractSchedulerJob => item !== null)
    .sort((a, b) => Number(b.active) - Number(a.active) || a.displayName.localeCompare(b.displayName));
}

export async function getSchedulerStatus(): Promise<FineractSchedulerStatus> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(SCHEDULER_PATH);
  if (!raw || typeof raw !== 'object') {
    return { active: false };
  }
  return { active: (raw as Record<string, unknown>).active === true };
}

export async function getSchedulerJob(jobId: number): Promise<FineractSchedulerJob | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${JOBS_PATH}/${jobId}`);
  return normalizeSchedulerJob(raw);
}

export async function getSchedulerJobHistory(jobId: number): Promise<FineractSchedulerJobHistoryPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${JOBS_PATH}/${jobId}/runhistory`);
  if (!raw || typeof raw !== 'object') {
    return { pageItems: [] };
  }
  const row = raw as Record<string, unknown>;
  const pageItems = Array.isArray(row.pageItems)
    ? row.pageItems
        .map((item) => normalizeRunHistory(item))
        .filter((item): item is NonNullable<typeof item> => item != null)
    : [];
  return { pageItems };
}

export async function updateSchedulerJob(jobId: number, input: UpdateSchedulerJobInput): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put(`${JOBS_PATH}/${jobId}`, input);
}

export async function runSchedulerCommand(command: 'start' | 'stop'): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${SCHEDULER_PATH}?command=${command}`, {});
}

export async function executeSchedulerJob(
  jobId: number,
  parameters?: RunJobWithParametersInput
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${JOBS_PATH}/${jobId}?command=executeJob`, parameters ?? {});
}

export async function listWorkflowJobNames(): Promise<string[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<FineractWorkflowJobNames>(`${JOBS_PATH}/names`);
  if (!raw?.businessJobs || !Array.isArray(raw.businessJobs)) {
    return [];
  }
  return raw.businessJobs.filter((name): name is string => typeof name === 'string').sort();
}

export async function getWorkflowJobSteps(jobName: string): Promise<FineractWorkflowJobSteps> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${JOBS_PATH}/${encodeURIComponent(jobName)}/steps`);
  if (!raw || typeof raw !== 'object') {
    return { businessSteps: [] };
  }
  const row = raw as Record<string, unknown>;
  const businessSteps = Array.isArray(row.businessSteps)
    ? row.businessSteps
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const step = item as Record<string, unknown>;
          const stepName = typeof step.stepName === 'string' ? step.stepName : '';
          const order = Number(step.order);
          if (!stepName || !Number.isFinite(order)) {
            return null;
          }
          return {
            stepName,
            stepDescription: typeof step.stepDescription === 'string' ? step.stepDescription : undefined,
            order
          };
        })
        .filter((step): step is NonNullable<typeof step> => step !== null)
        .sort((a, b) => a.order - b.order)
    : [];
  return { businessSteps };
}

export async function updateWorkflowJobSteps(
  jobName: string,
  input: UpdateWorkflowJobStepsInput
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put(`${JOBS_PATH}/${encodeURIComponent(jobName)}/steps`, input);
}

export async function getAvailableWorkflowSteps(jobCategory: string): Promise<FineractAvailableWorkflowSteps> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(
    `${JOBS_PATH}/${encodeURIComponent(jobCategory)}/available-steps`
  );
  if (!raw || typeof raw !== 'object') {
    return { availableBusinessSteps: [] };
  }
  const row = raw as Record<string, unknown>;
  const availableBusinessSteps = Array.isArray(row.availableBusinessSteps)
    ? row.availableBusinessSteps
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const step = item as Record<string, unknown>;
          const stepName = typeof step.stepName === 'string' ? step.stepName : '';
          if (!stepName) {
            return null;
          }
          return {
            stepName,
            stepDescription: typeof step.stepDescription === 'string' ? step.stepDescription : undefined
          };
        })
        .filter((step): step is NonNullable<typeof step> => step !== null)
    : [];
  return { availableBusinessSteps };
}

export async function runInlineJob(jobName: string, loanIds: number[]): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${JOBS_PATH}/${encodeURIComponent(jobName)}/inline`, { loanIds });
}
