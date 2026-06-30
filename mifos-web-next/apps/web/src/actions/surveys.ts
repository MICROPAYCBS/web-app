'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  toFineractActionError,
  validateUpsertSurveyForm,
  type UpsertSurveyFormInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  activateSurvey,
  createSurvey,
  deactivateSurvey,
  updateSurvey
} from '@/lib/fineract/surveys';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/system/surveys';

export type SurveysActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function surveyPath(surveyId: number | string) {
  return `${LIST_PATH}/${surveyId}`;
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

function revalidateSurveyViews(surveyId?: number) {
  revalidatePath(LIST_PATH);
  if (surveyId != null) {
    revalidatePath(surveyPath(surveyId));
    revalidatePath(`${surveyPath(surveyId)}/edit`);
  }
}

export async function createSurveyAction(input: UpsertSurveyFormInput): Promise<SurveysActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_SURVEY');
  } catch {
    return { ok: false, message: 'You do not have permission to create surveys.' };
  }

  const parsed = validateUpsertSurveyForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createSurvey(parsed.data);
    revalidateSurveyViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create survey.');
  }
}

export async function updateSurveyAction(
  surveyId: number,
  input: UpsertSurveyFormInput
): Promise<SurveysActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SURVEY');
  } catch {
    return { ok: false, message: 'You do not have permission to update surveys.' };
  }

  if (!Number.isFinite(surveyId)) {
    return { ok: false, message: 'Invalid survey id.' };
  }

  const parsed = validateUpsertSurveyForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateSurvey(surveyId, parsed.data);
    revalidateSurveyViews(surveyId);
    return actionSuccessFromFineractCommand(response, { resourceId: surveyId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update survey.');
  }
}

export async function activateSurveyAction(surveyId: number): Promise<SurveysActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SURVEY');
  } catch {
    return { ok: false, message: 'You do not have permission to activate surveys.' };
  }

  if (!Number.isFinite(surveyId)) {
    return { ok: false, message: 'Invalid survey id.' };
  }

  try {
    const response = await activateSurvey(surveyId);
    revalidateSurveyViews(surveyId);
    return actionSuccessFromFineractCommand(response, { resourceId: surveyId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to activate survey.');
  }
}

export async function deactivateSurveyAction(surveyId: number): Promise<SurveysActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SURVEY');
  } catch {
    return { ok: false, message: 'You do not have permission to deactivate surveys.' };
  }

  if (!Number.isFinite(surveyId)) {
    return { ok: false, message: 'Invalid survey id.' };
  }

  try {
    const response = await deactivateSurvey(surveyId);
    revalidateSurveyViews(surveyId);
    return actionSuccessFromFineractCommand(response, { resourceId: surveyId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to deactivate survey.');
  }
}
