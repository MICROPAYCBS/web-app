'use server';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  buildJobSequenceApiPayload,
  toFineractActionError,
  validateUpsertJobSequence,
  type UpsertJobSequenceInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  JOB_SEQUENCES_LIST_PATH,
  jobSequenceDetailPath
} from '@/lib/fineract/job-sequence-paths';
import {
  createJobSequence,
  deleteJobSequence,
  executeJobSequence,
  getJobSequenceRun,
  updateJobSequence
} from '@/lib/fineract/job-sequences';
import { getServerSession } from '@/lib/session/server';

export type JobSequenceActionResult =
  | { ok: true; resourceId?: number; subResourceId?: number }
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

function revalidateJobSequenceViews(sequenceId?: number) {
  revalidatePath(JOB_SEQUENCES_LIST_PATH);
  if (sequenceId != null) {
    revalidatePath(jobSequenceDetailPath(sequenceId));
    revalidatePath(`${jobSequenceDetailPath(sequenceId)}/edit`);
  }
}

export async function createJobSequenceAction(
  input: UpsertJobSequenceInput
): Promise<JobSequenceActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_JOBSEQUENCE');
  } catch {
    return { ok: false, message: 'You do not have permission to create job sequences.' };
  }

  const parsed = validateUpsertJobSequence(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createJobSequence(buildJobSequenceApiPayload(parsed.data));
    revalidateJobSequenceViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create job sequence.');
  }
}

export async function updateJobSequenceAction(
  sequenceId: number,
  input: UpsertJobSequenceInput
): Promise<JobSequenceActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_JOBSEQUENCE');
  } catch {
    return { ok: false, message: 'You do not have permission to update job sequences.' };
  }

  if (!Number.isFinite(sequenceId) || sequenceId <= 0) {
    return { ok: false, message: 'Invalid sequence id.' };
  }

  const parsed = validateUpsertJobSequence(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateJobSequence(sequenceId, buildJobSequenceApiPayload(parsed.data));
    revalidateJobSequenceViews(sequenceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId ?? sequenceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update job sequence.');
  }
}

export async function deleteJobSequenceAction(
  sequenceId: number
): Promise<JobSequenceActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_JOBSEQUENCE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete job sequences.' };
  }

  if (!Number.isFinite(sequenceId) || sequenceId <= 0) {
    return { ok: false, message: 'Invalid sequence id.' };
  }

  try {
    await deleteJobSequence(sequenceId);
    revalidateJobSequenceViews(sequenceId);
    return { ok: true, resourceId: sequenceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete job sequence.');
  }
}

export async function executeJobSequenceAction(
  sequenceId: number
): Promise<JobSequenceActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'EXECUTE_JOBSEQUENCE');
  } catch {
    return { ok: false, message: 'You do not have permission to execute job sequences.' };
  }

  if (!Number.isFinite(sequenceId) || sequenceId <= 0) {
    return { ok: false, message: 'Invalid sequence id.' };
  }

  try {
    const response = await executeJobSequence(sequenceId);
    revalidateJobSequenceViews(sequenceId);
    return {
      ok: true,
      resourceId: response.resourceId ?? sequenceId,
      subResourceId: response.subResourceId
    };
  } catch (error) {
    return toFineractActionError(error, 'Failed to start job sequence run.');
  }
}

/** Poll helper for run monitor (read permission). */
export async function fetchJobSequenceRunAction(
  sequenceId: number,
  runId: number
): Promise<
  | { ok: true; run: NonNullable<Awaited<ReturnType<typeof getJobSequenceRun>>> }
  | { ok: false; message: string }
> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_JOBSEQUENCE');
  } catch {
    return { ok: false, message: 'You do not have permission to view job sequence runs.' };
  }

  if (!Number.isFinite(sequenceId) || sequenceId <= 0 || !Number.isFinite(runId) || runId <= 0) {
    return { ok: false, message: 'Invalid sequence or run id.' };
  }

  try {
    const run = await getJobSequenceRun(sequenceId, runId);
    if (!run) {
      return { ok: false, message: 'Run not found.' };
    }
    return { ok: true, run };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load job sequence run.');
  }
}
