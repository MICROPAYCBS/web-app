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
  toFineractActionError,
  validateClientIdentifier,
  type CreateClientPayload,
  type FineractCommandActionMeta
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { getClientIdentifierTemplate } from '@/lib/fineract/client-identifiers';
import { createClient } from '@/lib/fineract/clients';
import { seedOnboardingClientContacts } from '@/lib/fineract/seed-onboarding-client-contacts';
import { getServerSession } from '@/lib/session/server';

export type ClientActionResult =
  | ({
      ok: true;
      clientId?: number;
      contactSeedWarning?: string;
    } & FineractCommandActionMeta)
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function createClientAction(
  raw: unknown
): Promise<ClientActionResult> {
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

  if (parsed.data.clientIdentifiers?.length) {
    let identityTypeOptions;
    try {
      const template = await getClientIdentifierTemplate(1);
      identityTypeOptions = template.identityTypeOptions;
    } catch {
      identityTypeOptions = undefined;
    }
    const identifierFieldErrors: Record<string, string> = {};
    for (const [index, identifier] of parsed.data.clientIdentifiers.entries()) {
      const result = validateClientIdentifier(identifier, { identityTypeOptions });
      if (!result.success) {
        const message = result.error.issues[0]?.message ?? 'Invalid identifier';
        identifierFieldErrors[`clientIdentifiers.${index}`] = message;
      }
    }
    if (Object.keys(identifierFieldErrors).length > 0) {
      return {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: identifierFieldErrors
      };
    }
  }

  try {
    const result = await createClient(parsed.data as CreateClientPayload);
    const clientId = result.clientId ?? result.resourceId;
    revalidatePath('/clients');
    if (clientId != null) {
      revalidatePath(`/clients/${clientId}`);
      revalidatePath(`/clients/${clientId}/contacts`);
      // Contacts embedded on create are persisted by the backend; only seed when absent.
      if (!parsed.data.contacts?.length) {
        const seeded = await seedOnboardingClientContacts(clientId, parsed.data);
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
  } catch (err) {
    return toFineractActionError(err, 'Failed to create customer.');
  }
}
