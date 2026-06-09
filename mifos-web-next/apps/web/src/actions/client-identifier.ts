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
  validateClientIdentifier,
  type ClientIdentifierInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createClientIdentifier,
  deleteClientIdentifier,
  getClientIdentifierTemplate
} from '@/lib/fineract/client-identifiers';
import { getServerSession } from '@/lib/session/server';

export type ClientIdentifierActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireCreatePermission(): Promise<ClientIdentifierActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'CREATE_CLIENTIDENTIFIER');
  } catch {
    return { ok: false, message: 'You do not have permission to add identifiers.' };
  }
  return null;
}

async function requireDeletePermission(): Promise<ClientIdentifierActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'DELETE_CLIENTIDENTIFIER');
  } catch {
    return { ok: false, message: 'You do not have permission to delete identifiers.' };
  }
  return null;
}

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

async function parseIdentifier(
  clientId: string,
  raw: unknown
): Promise<ClientIdentifierActionResult | ClientIdentifierInput> {
  let firstDocumentTypeId: number | undefined;
  try {
    const template = await getClientIdentifierTemplate(clientId);
    firstDocumentTypeId = template.allowedDocumentTypes?.[0]?.id;
  } catch {
    firstDocumentTypeId = undefined;
  }

  const parsed = validateClientIdentifier(raw, { firstDocumentTypeId });
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }
  return parsed.data;
}

export async function createClientIdentifierAction(
  clientId: string,
  raw: unknown
): Promise<ClientIdentifierActionResult> {
  const denied = await requireCreatePermission();
  if (denied) {
    return denied;
  }

  const parsed = await parseIdentifier(clientId, raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const result = await createClientIdentifier(clientId, parsed);
    revalidatePath(`/clients/${clientId}/identities`);
    return { ok: true, resourceId: result.resourceId };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function deleteClientIdentifierAction(
  clientId: string,
  identifierId: number
): Promise<ClientIdentifierActionResult> {
  const denied = await requireDeletePermission();
  if (denied) {
    return denied;
  }

  try {
    await deleteClientIdentifier(clientId, identifierId);
    revalidatePath(`/clients/${clientId}/identities`);
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}
