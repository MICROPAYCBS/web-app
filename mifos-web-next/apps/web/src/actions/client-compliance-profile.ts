'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  complianceProfileSchema,
  toFineractActionError,
  type ComplianceProfileInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { updateClientComplianceProfile } from '@/lib/fineract/client-compliance-profile';

export async function updateClientComplianceProfileAction(
  clientId: string,
  raw: unknown
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = complianceProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join('; ')
    };
  }

  try {
    await updateClientComplianceProfile(clientId, parsed.data);
    revalidatePath(`/clients/${clientId}/compliance-profile`);
    revalidatePath(`/clients/${clientId}/general`);
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export type { ComplianceProfileInput };
