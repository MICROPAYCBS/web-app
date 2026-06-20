'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { familyMemberSchema, toFineractActionError, type FamilyMemberInput } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createClientFamilyMember,
  deleteClientFamilyMember,
  updateClientFamilyMember
} from '@/lib/fineract/client-family';
import { getServerSession } from '@/lib/session/server';

export type ClientFamilyActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireUpdatePermission(): Promise<ClientFamilyActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update customers.' };
  }
  return null;
}

function parseMember(raw: unknown): ClientFamilyActionResult | FamilyMemberInput {
  const parsed = familyMemberSchema.safeParse(raw);
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

function mapError(err: unknown): ClientFamilyActionResult {
  return toFineractActionError(err, 'Request failed.');
}

export async function createClientFamilyMemberAction(
  clientId: string,
  raw: unknown
): Promise<ClientFamilyActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  const parsed = parseMember(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    await createClientFamilyMember(clientId, parsed);
    revalidatePath(`/clients/${clientId}/family-members`);
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}

export async function updateClientFamilyMemberAction(
  clientId: string,
  familyMemberId: number,
  raw: unknown
): Promise<ClientFamilyActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  const parsed = parseMember(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    await updateClientFamilyMember(clientId, familyMemberId, parsed);
    revalidatePath(`/clients/${clientId}/family-members`);
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}

export async function deleteClientFamilyMemberAction(
  clientId: string,
  familyMemberId: number
): Promise<ClientFamilyActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  try {
    await deleteClientFamilyMember(clientId, familyMemberId);
    revalidatePath(`/clients/${clientId}/family-members`);
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}
