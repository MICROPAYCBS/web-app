'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import { toFineractActionError, validateUpsertTemplateForm, type UpsertTemplateFormInput } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { createTemplate, deleteTemplate, updateTemplate } from '@/lib/fineract/templates';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/templates';

export type TemplatesActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function templatePath(templateId: number | string) {
  return `${LIST_PATH}/${templateId}`;
}

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

function revalidateTemplateViews(templateId?: number) {
  revalidatePath(LIST_PATH);
  if (templateId != null) {
    revalidatePath(templatePath(templateId));
    revalidatePath(`${templatePath(templateId)}/edit`);
  }
}

export async function createTemplateAction(
  input: UpsertTemplateFormInput
): Promise<TemplatesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_TEMPLATE');
  } catch {
    return { ok: false, message: 'You do not have permission to create templates.' };
  }

  const parsed = validateUpsertTemplateForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createTemplate(parsed.data);
    revalidateTemplateViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create template.');
  }
}

export async function updateTemplateAction(
  templateId: number,
  input: UpsertTemplateFormInput
): Promise<TemplatesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_TEMPLATE');
  } catch {
    return { ok: false, message: 'You do not have permission to update templates.' };
  }

  if (!Number.isFinite(templateId)) {
    return { ok: false, message: 'Invalid template id.' };
  }

  const parsed = validateUpsertTemplateForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updateTemplate(templateId, parsed.data);
    revalidateTemplateViews(templateId);
    return { ok: true, resourceId: templateId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update template.');
  }
}

export async function deleteTemplateAction(templateId: number): Promise<TemplatesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_TEMPLATE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete templates.' };
  }

  if (!Number.isFinite(templateId)) {
    return { ok: false, message: 'Invalid template id.' };
  }

  try {
    await deleteTemplate(templateId);
    revalidateTemplateViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete template.');
  }
}
