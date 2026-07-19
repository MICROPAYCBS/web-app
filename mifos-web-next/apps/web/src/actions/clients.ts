'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  createClientSchema,
  saveDraftClientSchema,
  toFineractActionError,
  validateClientIdentifier,
  type CreateClientPayload,
  type FineractCommandActionMeta,
  type SaveDraftClientPayload
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { getClientIdentifierTemplate } from '@/lib/fineract/client-identifiers';
import { createClient } from '@/lib/fineract/clients';
import { executeClientCommand } from '@/lib/fineract/client-commands';
import { seedOnboardingClientContacts } from '@/lib/fineract/seed-onboarding-client-contacts';
import { getServerSession } from '@/lib/session/server';

export type ClientActionResult =
  | ({
      ok: true;
      clientId?: number;
      contactSeedWarning?: string;
    } & FineractCommandActionMeta)
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
      /** Present when draft create succeeded but submit failed. */
      clientId?: number;
    };

async function validateOptionalIdentifiers(
  identifiers:
    | CreateClientPayload['clientIdentifiers']
    | SaveDraftClientPayload['clientIdentifiers']
): Promise<Record<string, string> | null> {
  if (!identifiers?.length) {
    return null;
  }
  let identityTypeOptions;
  try {
    const template = await getClientIdentifierTemplate(1);
    identityTypeOptions = template.identityTypeOptions;
  } catch {
    identityTypeOptions = undefined;
  }
  const identifierFieldErrors: Record<string, string> = {};
  for (const [index, identifier] of identifiers.entries()) {
    const result = validateClientIdentifier(identifier, { identityTypeOptions });
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Invalid identifier';
      identifierFieldErrors[`clientIdentifiers.${index}`] = message;
    }
  }
  if (Object.keys(identifierFieldErrors).length > 0) {
    return identifierFieldErrors;
  }
  return null;
}

async function finalizeCreatedClient(
  result: Awaited<ReturnType<typeof createClient>>,
  data: CreateClientPayload | SaveDraftClientPayload
): Promise<ClientActionResult> {
  const clientId = result.clientId ?? result.resourceId;
  revalidatePath('/clients');
  if (clientId != null) {
    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}/contacts`);
    if (!data.contacts?.length) {
      const seeded = await seedOnboardingClientContacts(clientId, data as CreateClientPayload);
      const success = actionSuccessFromFineractCommand(result, { clientId });
      if (!seeded.ok) {
        return {
          ...success,
          contactSeedWarning: seeded.message
        };
      }
      return success;
    }
    return actionSuccessFromFineractCommand(result, { clientId });
  }
  return actionSuccessFromFineractCommand(result, { clientId });
}

/** Full-schema create (Draft when active omitted). Kept for non-wizard callers. */
export async function createClientAction(raw: unknown): Promise<ClientActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create customers.' };
  }

  const parsed = createClientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }

  const identifierFieldErrors = await validateOptionalIdentifiers(parsed.data.clientIdentifiers);
  if (identifierFieldErrors) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: identifierFieldErrors
    };
  }

  try {
    const result = await createClient(parsed.data as CreateClientPayload);
    return await finalizeCreatedClient(result, parsed.data);
  } catch (err) {
    return toFineractActionError(err, 'Failed to create customer.');
  }
}

/** Soft save as Draft via `POST /clients` (active omitted). */
export async function saveClientDraftAction(raw: unknown): Promise<ClientActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create customers.' };
  }

  const parsed = saveDraftClientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }

  const identifierFieldErrors = await validateOptionalIdentifiers(parsed.data.clientIdentifiers);
  if (identifierFieldErrors) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: identifierFieldErrors
    };
  }

  try {
    const result = await createClient(parsed.data);
    return await finalizeCreatedClient(result, parsed.data);
  } catch (err) {
    return toFineractActionError(err, 'Failed to save customer draft.');
  }
}

/**
 * Wizard Submit: create Draft, then `POST /clients/{id}?command=submit` → Pending.
 * If submit fails after create, returns the Draft client id so the UI can retry.
 */
export async function submitClientFromCreateAction(raw: unknown): Promise<ClientActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
    assertCan(session, resolvePermission('clients.submit'));
  } catch {
    return {
      ok: false,
      message: 'You do not have permission to submit customers.'
    };
  }

  const parsed = createClientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }

  const identifierFieldErrors = await validateOptionalIdentifiers(parsed.data.clientIdentifiers);
  if (identifierFieldErrors) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: identifierFieldErrors
    };
  }

  try {
    const saved = await createClient(parsed.data as CreateClientPayload);
    const clientId = saved.clientId ?? saved.resourceId;
    if (clientId == null) {
      return {
        ok: false,
        message: 'Customer was saved but could not be submitted.'
      };
    }

    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);

    try {
      const submitted = await executeClientCommand(String(clientId), 'submit', {});
      if (!parsed.data.contacts?.length) {
        const seeded = await seedOnboardingClientContacts(clientId, parsed.data);
        const success = actionSuccessFromFineractCommand(submitted, { clientId });
        if (!seeded.ok) {
          return { ...success, contactSeedWarning: seeded.message };
        }
        return success;
      }
      return actionSuccessFromFineractCommand(submitted, { clientId });
    } catch (submitErr) {
      const submitFailure = toFineractActionError(
        submitErr,
        'Customer was saved as a draft, but could not be submitted.'
      );
      return {
        ok: false,
        message: submitFailure.message,
        fieldErrors: submitFailure.fieldErrors,
        clientId: typeof clientId === 'number' ? clientId : Number(clientId)
      };
    }
  } catch (err) {
    return toFineractActionError(err, 'Failed to submit customer.');
  }
}
