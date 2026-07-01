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
  validateUpdateExternalEventConfiguration,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { updateExternalEventConfiguration } from '@/lib/fineract/external-events';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/system/external-events';

export type ExternalEventsActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateExternalEventConfigurationAction(
  externalEventConfigurations: Record<string, boolean>
): Promise<ExternalEventsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_EXTERNAL_EVENT_CONFIGURATION');
  } catch {
    return { ok: false, message: 'You do not have permission to update external events.' };
  }

  const parsed = validateUpdateExternalEventConfiguration({
    externalEventConfigurations
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid configuration payload.'
    };
  }

  try {
    const response = await updateExternalEventConfiguration(parsed.data.externalEventConfigurations);
    revalidatePath(LIST_PATH);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to apply external event changes.');
  }
}
