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
  createStandingInstructionSchema,
  toFineractActionError,
  type CreateStandingInstructionInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import type { StandingInstructionTemplate, StandingInstructionsPage } from '@mifos/api-client';
import { revalidatePath } from 'next/cache';
import {
  buildCreateStandingInstructionBody,
  createStandingInstruction,
  deleteStandingInstruction,
  getStandingInstruction,
  getStandingInstructionTemplate,
  listStandingInstructions,
  type StandingInstructionListQuery,
  type StandingInstructionTemplateQuery
} from '@/lib/fineract/standing-instructions';
import { clientStandingInstructionsListPath } from '@/lib/fineract/client-secondary-list-paths';
import type { StandingInstructionDetail } from '@mifos/api-client';
import type { StandingInstructionActionResult } from '@/lib/fineract/standing-instruction-action-result';
import type { StandingInstructionTemplateResult } from '@/lib/fineract/standing-instruction-action-result';
import { getServerSession } from '@/lib/session/server';

function revalidateStandingInstructionPaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

function parseCreateInput(
  raw: unknown
): StandingInstructionActionResult | CreateStandingInstructionInput {
  const parsed = createStandingInstructionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }
  return parsed.data;
}

export async function fetchClientStandingInstructionsAction(
  query: StandingInstructionListQuery
): Promise<StandingInstructionsPage | StandingInstructionActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'READ_STANDINGINSTRUCTION');
    return await listStandingInstructions(query);
  } catch (err) {
    return toFineractActionError(err, 'Could not load standing instructions.');
  }
}

export async function fetchStandingInstructionTemplateAction(
  query: StandingInstructionTemplateQuery
): Promise<StandingInstructionTemplateResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'READ_STANDINGINSTRUCTION');
    return await getStandingInstructionTemplate(query);
  } catch (err) {
    return toFineractActionError(err, 'Could not load form options.');
  }
}

export async function fetchStandingInstructionDetailAction(
  instructionId: string | number
): Promise<
  | StandingInstructionDetail
  | Extract<StandingInstructionActionResult, { ok: false }>
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'READ_STANDINGINSTRUCTION');
    return await getStandingInstruction(instructionId);
  } catch (err) {
    return toFineractActionError(err, 'Could not load standing instruction.');
  }
}

export async function createClientStandingInstructionAction(
  clientId: string,
  fromOfficeId: string | number,
  raw: unknown,
  options?: { revalidatePaths?: string[] }
): Promise<StandingInstructionActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'CREATE_STANDINGINSTRUCTION');
  } catch {
    return { ok: false, message: 'You do not have permission to create standing instructions.' };
  }

  const parsed = parseCreateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  const { destination: _destination, ...fields } = parsed;

  try {
    const body = buildCreateStandingInstructionBody(fields, {
      fromClientId: clientId,
      fromOfficeId
    });
    const response = await createStandingInstruction(body);
    revalidatePath(clientStandingInstructionsListPath(clientId));
    if (options?.revalidatePaths?.length) {
      revalidateStandingInstructionPaths(options.revalidatePaths);
    }
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not create standing instruction.');
  }
}

export async function deleteClientStandingInstructionAction(
  clientId: string,
  instructionId: string | number,
  options?: { revalidatePaths?: string[] }
): Promise<StandingInstructionActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'DELETE_STANDINGINSTRUCTION');
  } catch {
    return { ok: false, message: 'You do not have permission to delete standing instructions.' };
  }

  try {
    const response = await deleteStandingInstruction(instructionId);
    revalidatePath(clientStandingInstructionsListPath(clientId));
    if (options?.revalidatePaths?.length) {
      revalidateStandingInstructionPaths(options.revalidatePaths);
    }
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not delete standing instruction.');
  }
}
