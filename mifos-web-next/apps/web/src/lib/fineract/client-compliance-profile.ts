/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractClientComplianceProfile, FineractCommandProcessingResult } from '@mifos/api-client';
import type { ComplianceProfileInput } from '@mifos/validation';
import { buildComplianceProfilePutBody } from '@/lib/fineract/compliance-profile-payload';
import { normalizeClientComplianceProfile } from '@/lib/fineract/compliance-profile-normalize';
import { createFineractClient } from '@/lib/fineract/create-client';

export async function getClientComplianceProfile(
  clientId: string | number
): Promise<FineractClientComplianceProfile | null> {
  const fineract = await createFineractClient();
  try {
    const data = await fineract.get<unknown>(`/clients/${clientId}/complianceprofile`);
    return normalizeClientComplianceProfile(data);
  } catch {
    return null;
  }
}

export async function updateClientComplianceProfile(
  clientId: string | number,
  input: ComplianceProfileInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `/clients/${clientId}/complianceprofile`,
    buildComplianceProfilePutBody(input)
  );
}
