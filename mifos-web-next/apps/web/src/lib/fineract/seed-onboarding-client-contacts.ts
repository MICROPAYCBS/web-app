import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateClientPayload } from '@mifos/validation';
import { toFineractActionError, validateClientContact } from '@mifos/validation';
import {
  mapOnboardingFieldsToClientContacts
} from '@/lib/clients/onboarding-client-contacts';
import {
  createClientContact,
  getClientContactTemplate
} from '@/lib/fineract/client-contacts';

export type SeedOnboardingClientContactsResult =
  | { ok: true; createdCount: number }
  | { ok: false; message: string; createdCount: number };

/**
 * After POST /clients, mirror onboarding contact scalars into /clients/{id}/contacts
 * so the Customer contacts tab is populated.
 */
export async function seedOnboardingClientContacts(
  clientId: string | number,
  payload: Pick<
    CreateClientPayload,
    'mobileNo' | 'alternativeMobileNo' | 'emailAddress' | 'alternativeEmailAddress'
  >
): Promise<SeedOnboardingClientContactsResult> {
  let template;
  try {
    template = await getClientContactTemplate(clientId);
  } catch {
    return {
      ok: false,
      message: 'Customer was created, but contact types could not be loaded for seeding contacts.',
      createdCount: 0
    };
  }

  const mapped = mapOnboardingFieldsToClientContacts(
    {
      mobileNo: payload.mobileNo,
      alternativeMobileNo: payload.alternativeMobileNo,
      emailAddress: payload.emailAddress,
      alternativeEmailAddress: payload.alternativeEmailAddress
    },
    template.contactTypeOptions
  );

  if (mapped.length === 0) {
    return { ok: true, createdCount: 0 };
  }

  let createdCount = 0;
  for (const contact of mapped) {
    const parsed = validateClientContact(
      {
        contactTypeId: contact.contactTypeId,
        contactValue: contact.contactValue,
        primary: contact.primary
      },
      { contactTypeOptions: template.contactTypeOptions }
    );
    if (!parsed.success) {
      return {
        ok: false,
        message: `Customer was created, but ${contact.typeName} contact could not be saved: ${parsed.error.issues[0]?.message ?? 'Invalid contact value.'}`,
        createdCount
      };
    }

    try {
      await createClientContact(clientId, parsed.data);
      createdCount += 1;
    } catch (error) {
      const mapped = toFineractActionError(error, 'Failed to save customer contact.');
      return {
        ok: false,
        message: `Customer was created, but ${contact.typeName} contact could not be saved: ${mapped.message}`,
        createdCount
      };
    }
  }

  return { ok: true, createdCount };
}
