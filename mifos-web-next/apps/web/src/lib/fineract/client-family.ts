/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractClientFamilyMember, FineractCommandProcessingResult } from '@mifos/api-client';
import type { FamilyMemberInput } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (value === '' || value === undefined) {
      delete next[key];
    }
  }
  return next;
}

function toFamilyBody(member: FamilyMemberInput): Record<string, unknown> {
  return stripEmpty({
    ...member,
    dateFormat: member.dateFormat ?? FINERACT_DATE_FORMAT,
    locale: member.locale ?? FINERACT_LOCALE
  });
}

export async function getClientFamilyMembers(
  clientId: string | number
): Promise<FineractClientFamilyMember[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<FineractClientFamilyMember[]>(
    `/clients/${clientId}/familymembers`
  );
  return Array.isArray(data) ? data : [];
}

export async function createClientFamilyMember(
  clientId: string | number,
  member: FamilyMemberInput
): Promise<{ resourceId: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId: number }>(
    `/clients/${clientId}/familymembers`,
    toFamilyBody(member)
  );
}

export async function updateClientFamilyMember(
  clientId: string | number,
  familyMemberId: number,
  member: FamilyMemberInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(`/clients/${clientId}/familymembers/${familyMemberId}`, toFamilyBody(member));
}

export async function deleteClientFamilyMember(
  clientId: string | number,
  familyMemberId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/clients/${clientId}/familymembers/${familyMemberId}`);
}
