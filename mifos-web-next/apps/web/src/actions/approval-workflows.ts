'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';
import { assertCan } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  buildWorkflowDefinitionApiPayload,
  toFineractActionError,
  validateUpsertWorkflowDefinition,
  type UpsertWorkflowDefinitionInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { APPROVAL_WORKFLOWS_LIST_PATH, approvalWorkflowDetailPath } from '@/lib/fineract/approval-workflow-paths';
import {
  activateWorkflowDefinition,
  createWorkflowDefinition,
  deactivateWorkflowDefinition,
  deleteWorkflowDefinition,
  updateWorkflowDefinition
} from '@/lib/fineract/approval-workflows';
import { getServerSession } from '@/lib/session/server';

export type ApprovalWorkflowActionResult =
  | { ok: true; resourceId?: number; activationError?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; activationError?: string };

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

function revalidateApprovalWorkflowViews(definitionId?: number) {
  revalidatePath(APPROVAL_WORKFLOWS_LIST_PATH);
  if (definitionId != null) {
    revalidatePath(approvalWorkflowDetailPath(definitionId));
    revalidatePath(`${approvalWorkflowDetailPath(definitionId)}/edit`);
  }
}

function activationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FineractHttpError) {
    const developerMessage = error.body?.errors?.find(
      (item) => typeof item.developerMessage === 'string' && item.developerMessage.trim()
    )?.developerMessage;
    if (developerMessage) {
      return developerMessage.trim();
    }
    return toFineractActionError(error, fallback).message;
  }
  return error instanceof Error ? error.message : fallback;
}

export async function createApprovalWorkflowAction(
  input: UpsertWorkflowDefinitionInput
): Promise<ApprovalWorkflowActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_WORKFLOW_DEFINITION');
  } catch {
    return { ok: false, message: 'You do not have permission to create approval workflows.' };
  }

  const parsed = validateUpsertWorkflowDefinition(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createWorkflowDefinition(buildWorkflowDefinitionApiPayload(parsed.data));
    revalidateApprovalWorkflowViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create approval workflow.');
  }
}

export async function updateApprovalWorkflowAction(
  definitionId: number,
  input: UpsertWorkflowDefinitionInput
): Promise<ApprovalWorkflowActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_WORKFLOW_DEFINITION');
  } catch {
    return { ok: false, message: 'You do not have permission to update approval workflows.' };
  }

  if (!Number.isFinite(definitionId)) {
    return { ok: false, message: 'Invalid workflow id.' };
  }

  const parsed = validateUpsertWorkflowDefinition(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateWorkflowDefinition(
      definitionId,
      buildWorkflowDefinitionApiPayload(parsed.data)
    );
    revalidateApprovalWorkflowViews(definitionId);
    return actionSuccessFromFineractCommand(response, { resourceId: definitionId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update approval workflow.');
  }
}

export async function activateApprovalWorkflowAction(
  definitionId: number
): Promise<ApprovalWorkflowActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'ACTIVATE_WORKFLOW_DEFINITION');
  } catch {
    return { ok: false, message: 'You do not have permission to activate approval workflows.' };
  }

  if (!Number.isFinite(definitionId)) {
    return { ok: false, message: 'Invalid workflow id.' };
  }

  try {
    const response = await activateWorkflowDefinition(definitionId);
    revalidateApprovalWorkflowViews(definitionId);
    return actionSuccessFromFineractCommand(response, { resourceId: definitionId });
  } catch (error) {
    const message = activationErrorMessage(error, 'Failed to activate approval workflow.');
    return { ok: false, message, activationError: message };
  }
}

export async function deactivateApprovalWorkflowAction(
  definitionId: number
): Promise<ApprovalWorkflowActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DEACTIVATE_WORKFLOW_DEFINITION');
  } catch {
    return { ok: false, message: 'You do not have permission to deactivate approval workflows.' };
  }

  if (!Number.isFinite(definitionId)) {
    return { ok: false, message: 'Invalid workflow id.' };
  }

  try {
    const response = await deactivateWorkflowDefinition(definitionId);
    revalidateApprovalWorkflowViews(definitionId);
    return actionSuccessFromFineractCommand(response, { resourceId: definitionId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to deactivate approval workflow.');
  }
}

export async function deleteApprovalWorkflowAction(
  definitionId: number
): Promise<ApprovalWorkflowActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_WORKFLOW_DEFINITION');
  } catch {
    return { ok: false, message: 'You do not have permission to delete approval workflows.' };
  }

  if (!Number.isFinite(definitionId)) {
    return { ok: false, message: 'Invalid workflow id.' };
  }

  try {
    const response = await deleteWorkflowDefinition(definitionId);
    revalidateApprovalWorkflowViews(definitionId);
    return actionSuccessFromFineractCommand(response, { resourceId: definitionId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete approval workflow.');
  }
}
