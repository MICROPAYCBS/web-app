'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BulkImportHistoryItem, BulkImportStaffOption } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  createClientSchema,
  legacyImportClientSchema,
  saveDraftClientSchema,
  toFineractActionError,
  validateClientIdentifier,
  type CreateClientPayload,
  type FineractCommandActionMeta,
  type LegacyImportClientPayload,
  type SaveDraftClientPayload
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { CLIENTS_LEGACY_BULK_IMPORT_NAME } from '@/lib/clients/clients-import-legacy';
import { getBulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { resolveClientLegalFormTypeFromFilename } from '@/lib/fineract/bulk-import-display';
import {
  listActiveStaffByOffice,
  listBulkImportHistory,
  uploadBulkImportTemplate
} from '@/lib/fineract/bulk-import';
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
  data: CreateClientPayload | SaveDraftClientPayload | LegacyImportClientPayload
): Promise<ClientActionResult> {
  const clientId = result.clientId ?? result.resourceId;
  revalidatePath('/clients');
  if (clientId != null) {
    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}/contacts`);
    const hasContacts = 'contacts' in data && Boolean(data.contacts?.length);
    if (!hasContacts) {
      const seeded = await seedOnboardingClientContacts(clientId, {
        mobileNo: data.mobileNo,
        alternativeMobileNo:
          'alternativeMobileNo' in data ? data.alternativeMobileNo : undefined,
        emailAddress: 'emailAddress' in data ? data.emailAddress : undefined,
        alternativeEmailAddress:
          'alternativeEmailAddress' in data ? data.alternativeEmailAddress : undefined
      } as Pick<
        CreateClientPayload,
        'mobileNo' | 'alternativeMobileNo' | 'emailAddress' | 'alternativeEmailAddress'
      >);
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

/** Activated create from the platform Customers Excel template (guided legacy import). */
export async function createLegacyImportClientAction(raw: unknown): Promise<ClientActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create customers.' };
  }

  const parsed = legacyImportClientSchema.safeParse(raw);
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

  try {
    const result = await createClient(parsed.data);
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
  } catch {
    return {
      ok: false,
      message: 'You do not have permission to create customers.'
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

export type ClientsImportDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export async function loadClientsImportStaffAction(
  officeId: string | number
): Promise<ClientsImportDataResult<BulkImportStaffOption[]>> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to import customers.' };
  }

  try {
    const data = await listActiveStaffByOffice(officeId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load staff for the selected branch.');
  }
}

export async function refreshClientsLegacyImportHistoryAction(): Promise<
  ClientsImportDataResult<BulkImportHistoryItem[]>
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to import customers.' };
  }

  const definition = getBulkImportDefinition(CLIENTS_LEGACY_BULK_IMPORT_NAME);
  if (!definition) {
    return { ok: false, message: 'Customers bulk import is not configured.' };
  }

  try {
    const data = await listBulkImportHistory(definition.entityType);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to refresh import history.');
  }
}

export async function uploadClientsLegacyImportAction(
  formData: FormData
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to import customers.' };
  }

  const definition = getBulkImportDefinition(CLIENTS_LEGACY_BULK_IMPORT_NAME);
  if (!definition) {
    return { ok: false, message: 'Customers bulk import is not configured.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Select an Excel file to upload.' };
  }

  const legalFormType = resolveClientLegalFormTypeFromFilename(file.name);
  if (!legalFormType) {
    return {
      ok: false,
      message: 'Keep Person or Entity in the filename before uploading.'
    };
  }

  try {
    const response = await uploadBulkImportTemplate(definition, file, legalFormType);
    revalidatePath('/clients');
    revalidatePath('/clients/import');
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to upload import file.');
  }
}
