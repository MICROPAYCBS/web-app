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
  validateUpdateNotificationExternalService,
  validateUpdateS3ExternalService,
  validateUpdateSmsExternalService,
  validateUpdateSmtpExternalService
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  getExternalServiceDefinition,
  type ExternalServiceSlug
} from '@/lib/fineract/external-service-display';
import { updateExternalServiceConfiguration } from '@/lib/fineract/external-services';
import { getServerSession } from '@/lib/session/server';

export type ExternalServiceActionResult = { ok: true } | { ok: false; message: string };

function revalidateExternalServicePaths() {
  revalidatePath('/system/external-services');
}

export async function updateExternalServiceAction(
  slug: ExternalServiceSlug,
  input: unknown
): Promise<ExternalServiceActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_EXTERNALSERVICES');
  } catch {
    return { ok: false, message: 'You do not have permission to update external services.' };
  }

  const definition = getExternalServiceDefinition(slug);

  try {
    switch (definition.apiName) {
      case 'S3': {
        const parsed = validateUpdateS3ExternalService(input);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.issues[0]?.message ?? 'Invalid S3 configuration.'
          };
        }
        await updateExternalServiceConfiguration(definition.apiName, parsed.data);
        break;
      }
      case 'SMTP': {
        const parsed = validateUpdateSmtpExternalService(input);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.issues[0]?.message ?? 'Invalid email configuration.'
          };
        }
        await updateExternalServiceConfiguration(definition.apiName, parsed.data);
        break;
      }
      case 'SMS': {
        const parsed = validateUpdateSmsExternalService(input);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.issues[0]?.message ?? 'Invalid SMS configuration.'
          };
        }
        await updateExternalServiceConfiguration(definition.apiName, parsed.data);
        break;
      }
      case 'NOTIFICATION': {
        const parsed = validateUpdateNotificationExternalService(input);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.issues[0]?.message ?? 'Invalid notification configuration.'
          };
        }
        await updateExternalServiceConfiguration(definition.apiName, parsed.data);
        break;
      }
      default:
        return { ok: false, message: 'Unsupported external service.' };
    }

    revalidateExternalServicePaths();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update external service configuration.');
  }
}
