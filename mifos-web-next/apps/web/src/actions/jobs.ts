'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import type {
  FineractAvailableWorkflowStep,
  FineractSchedulerJob,
  FineractSchedulerJobRunHistory,
  FineractWorkflowJobStep
} from '@mifos/api-client';
import {
  toFineractActionError,
  validateInlineCob,
  validateRunJobWithParameters,
  validateUpdateSchedulerJob,
  validateUpdateWorkflowJobSteps,
  type JobParameterInput,
  type UpdateSchedulerJobInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  executeSchedulerJob,
  getAvailableWorkflowSteps,
  getSchedulerJob,
  getWorkflowJobSteps,
  listSchedulerJobs,
  listWorkflowJobNames,
  runInlineJob,
  runSchedulerCommand,
  updateSchedulerJob,
  updateWorkflowJobSteps
} from '@/lib/fineract/jobs';
import { getCobCatchUpStatus, getLoanClientId, listLockedLoans, startCobCatchUp } from '@/lib/fineract/loans-cob';
import { getServerSession } from '@/lib/session/server';

const MANAGE_JOBS_PATH = '/system/manage-jobs';

export type JobsActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateManageJobs(jobId?: number) {
  revalidatePath(MANAGE_JOBS_PATH);
  if (jobId != null) {
    revalidatePath(`${MANAGE_JOBS_PATH}/${jobId}`);
    revalidatePath(`${MANAGE_JOBS_PATH}/${jobId}/edit`);
    revalidatePath(`${MANAGE_JOBS_PATH}/${jobId}/history`);
  }
}

export async function updateSchedulerJobAction(
  jobId: number,
  input: UpdateSchedulerJobInput
): Promise<JobsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to update scheduler jobs.' };
  }

  const parsed = validateUpdateSchedulerJob(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateSchedulerJob(jobId, parsed.data);
    revalidateManageJobs(jobId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to update scheduler job.');
  }
}

export async function runSchedulerCommandAction(command: 'start' | 'stop'): Promise<JobsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to change scheduler status.' };
  }

  try {
    const response = await runSchedulerCommand(command);
    revalidateManageJobs();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to update scheduler status.');
  }
}

export async function fetchSchedulerJobsAction(): Promise<
  { ok: true; jobs: FineractSchedulerJob[] } | { ok: false; message: string }
> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to view scheduler jobs.' };
  }

  try {
    const jobs = await listSchedulerJobs();
    return { ok: true, jobs };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load scheduler jobs.');
  }
}

export async function fetchSchedulerJobAction(
  jobId: number
): Promise<{ ok: true; job: FineractSchedulerJob } | { ok: false; message: string }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to view scheduler jobs.' };
  }

  try {
    const job = await getSchedulerJob(jobId);
    if (job == null) {
      return { ok: false, message: 'Scheduler job not found.' };
    }
    return { ok: true, job };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load scheduler job.');
  }
}

export async function executeSchedulerJobsAction(
  jobs: Array<{ jobId: number; jobParameters?: JobParameterInput[] }>
): Promise<JobsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'EXECUTEJOB_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to run scheduler jobs.' };
  }

  try {
    for (const job of jobs) {
      if (job.jobParameters?.length) {
        const parsed = validateRunJobWithParameters({ jobParameters: job.jobParameters });
        if (!parsed.success) {
          return {
            ok: false,
            message: 'Fix the highlighted fields.',
            fieldErrors: zodFieldErrors(parsed.error)
          };
        }
        const response = await executeSchedulerJob(job.jobId, parsed.data);
      } else {
        await executeSchedulerJob(job.jobId);
      }
    }
    revalidateManageJobs();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to run scheduler jobs.');
  }
}

export async function fetchWorkflowJobStepsAction(
  jobName: string
): Promise<{ ok: true; steps: FineractWorkflowJobStep[] } | { ok: false; message: string }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to view workflow jobs.' };
  }

  try {
    const result = await getWorkflowJobSteps(jobName);
    return { ok: true, steps: result.businessSteps };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load workflow steps.');
  }
}

export async function fetchAvailableWorkflowStepsAction(
  jobName: string
): Promise<{ ok: true; steps: FineractAvailableWorkflowStep[] } | { ok: false; message: string }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to view workflow jobs.' };
  }

  const jobCategory = jobName.split('_')[0] ?? jobName;
  try {
    const result = await getAvailableWorkflowSteps(jobCategory);
    return { ok: true, steps: result.availableBusinessSteps };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load available workflow steps.');
  }
}

export async function updateWorkflowJobStepsAction(
  jobName: string,
  steps: FineractWorkflowJobStep[]
): Promise<JobsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to update workflow jobs.' };
  }

  const payload = {
    businessSteps: steps.map((step, index) => ({
      ...step,
      order: index + 1
    }))
  };
  const parsed = validateUpdateWorkflowJobSteps(payload);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateWorkflowJobSteps(jobName, parsed.data);
    revalidateManageJobs();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to save workflow steps.');
  }
}

export async function fetchWorkflowJobNamesAction(): Promise<
  { ok: true; names: string[] } | { ok: false; message: string }
> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to view workflow jobs.' };
  }

  try {
    const names = await listWorkflowJobNames();
    return { ok: true, names };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load workflow job names.');
  }
}

export async function startCobCatchUpAction(): Promise<JobsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to start catch-up.' };
  }

  try {
    const response = await startCobCatchUp();
    revalidateManageJobs();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to start catch-up.');
  }
}

export async function runInlineCobAction(loanIds: number[]): Promise<JobsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'EXECUTE_INLINE_JOB');
  } catch {
    return { ok: false, message: 'You do not have permission to run inline COB.' };
  }

  const parsed = validateInlineCob({ loanIds });
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Select at least one loan.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await runInlineJob('LOAN_COB', parsed.data.loanIds);
    revalidateManageJobs();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to run inline COB.');
  }
}

export async function fetchCobStatusAction(): Promise<
  { ok: true; isCatchUpRunning: boolean } | { ok: false; message: string }
> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to view COB status.' };
  }

  try {
    const status = await getCobCatchUpStatus();
    return { ok: true, isCatchUpRunning: status.isCatchUpRunning };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load COB status.');
  }
}

export async function fetchLockedLoansAction(): Promise<
  | { ok: true; loans: Awaited<ReturnType<typeof listLockedLoans>>['content'] }
  | { ok: false; message: string }
> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to view locked loans.' };
  }

  try {
    const page = await listLockedLoans();
    return { ok: true, loans: page.content };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load locked loans.');
  }
}

export async function resolveLoanClientPathAction(
  loanId: number
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_SCHEDULER');
  } catch {
    return { ok: false, message: 'You do not have permission to view loan details.' };
  }

  try {
    const clientId = await getLoanClientId(loanId);
    if (clientId == null) {
      return { ok: false, message: 'Loan account not found.' };
    }
    return { ok: true, path: `/clients/${clientId}/loans-accounts/${loanId}/general` };
  } catch (error) {
    return toFineractActionError(error, 'Failed to resolve loan account.');
  }
}

export type SchedulerJobHistoryResult =
  | { ok: true; items: FineractSchedulerJobRunHistory[] }
  | { ok: false; message: string };
