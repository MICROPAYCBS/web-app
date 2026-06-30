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
  complianceProfileSchema,
  mapComplianceProfileFineractFieldErrors,
  mapFineractErrors,
  prepareComplianceProfileForValidation,
  toFineractActionError,
  type ComplianceProfileInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { FineractHttpError } from '@mifos/api-client';
import { revalidatePath } from 'next/cache';
import { updateClientComplianceProfile } from '@/lib/fineract/client-compliance-profile';
import { getServerSession } from '@/lib/session/server';

export type UpdateClientComplianceProfileActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function updateClientComplianceProfileAction(
  clientId: string,
  raw: unknown
): Promise<UpdateClientComplianceProfileActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.compliance-profile.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update compliance details.' };
  }

  const parsed = complianceProfileSchema.safeParse(
    prepareComplianceProfileForValidation(raw as ComplianceProfileInput)
  );
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_form';
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }

  try {
    const response = await updateClientComplianceProfile(clientId, parsed.data);
    revalidatePath(`/clients/${clientId}/compliance-profile`);
    revalidatePath(`/clients/${clientId}/general`);
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    if (err instanceof FineractHttpError) {
      const mapped = mapFineractErrors(err.body);
      const fieldErrors = mapComplianceProfileFineractFieldErrors(mapped.fieldErrors);
      const result = toFineractActionError(err, 'Could not update compliance details.');
      return {
        ...result,
        fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : result.fieldErrors
      };
    }
    return toFineractActionError(err, 'Could not update compliance details.');
  }
}

export type { ComplianceProfileInput };
