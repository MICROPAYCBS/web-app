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
  toFineractActionError,
  validateClientContact,
  type ClientContactInput,
  type ClientContactValidationContext,
  type FineractCommandActionMeta
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createClientContact,
  deleteClientContact,
  getClientContactTemplate,
  updateClientContact
} from '@/lib/fineract/client-contacts';
import { getServerSession } from '@/lib/session/server';

export type ClientContactActionResult =
  | ({ ok: true; resourceId?: number } & FineractCommandActionMeta)
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function revalidateClientContactViews(clientId: string) {
  revalidatePath(`/clients/${clientId}/general`);
  revalidatePath(`/clients/${clientId}/contacts`);
}

type ParseClientContactResult = ClientContactActionResult | ClientContactInput;

async function parseClientContact(
  clientId: string,
  raw: unknown
): Promise<ParseClientContactResult> {
  let contactTypeOptions: NonNullable<ClientContactValidationContext['contactTypeOptions']> = [];
  try {
    const template = await getClientContactTemplate(clientId);
    contactTypeOptions = template.contactTypeOptions;
  } catch {
    contactTypeOptions = [];
  }

  const parsed = validateClientContact(raw, { contactTypeOptions });
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }
  return parsed.data;
}

export async function createClientContactAction(
  clientId: string,
  raw: unknown
): Promise<ClientContactActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'CREATE_CLIENTCONTACT');
  } catch {
    return { ok: false, message: 'You do not have permission to add customer contacts.' };
  }

  const parsed = await parseClientContact(clientId, raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const result = await createClientContact(clientId, parsed);
    revalidateClientContactViews(clientId);
    return actionSuccessFromFineractCommand(result, { resourceId: result.resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Failed to save customer contact.');
  }
}

export async function updateClientContactAction(
  clientId: string,
  contactId: number,
  raw: unknown
): Promise<ClientContactActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'UPDATE_CLIENTCONTACT');
  } catch {
    return { ok: false, message: 'You do not have permission to update customer contacts.' };
  }

  const parsed = await parseClientContact(clientId, raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const result = await updateClientContact(clientId, contactId, parsed);
    revalidateClientContactViews(clientId);
    return actionSuccessFromFineractCommand(result, { resourceId: result.resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Failed to update customer contact.');
  }
}

export async function deleteClientContactAction(
  clientId: string,
  contactId: number
): Promise<ClientContactActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'DELETE_CLIENTCONTACT');
  } catch {
    return { ok: false, message: 'You do not have permission to delete customer contacts.' };
  }

  try {
    const response = await deleteClientContact(clientId, contactId);
    revalidateClientContactViews(clientId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Failed to delete customer contact.');
  }
}
