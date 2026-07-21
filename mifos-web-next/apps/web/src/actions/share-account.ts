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
  actionSuccessFromFineractCommand,
  createShareAccountSchema,
  toFineractActionError,
  updateShareAccountSchema,
  type CreateShareAccountInput,
  type UpdateShareAccountInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  CREATE_SHARE_ACCOUNT_PERMISSION,
  clientShareAccountCreatePath
} from '@/lib/fineract/share-account-config';
import {
  isShareAccountActionError,
  type ShareAccountActionResult
} from '@/lib/fineract/share-account-action-result';
import {
  createShareAccountRecord,
  getShareAccount,
  getShareAccountTemplate,
  updateShareAccountRecord
} from '@/lib/fineract/share-accounts';
import { clientAccountGeneralPath, clientAccountListPath } from '@/lib/fineract/client-account-links';
import { getServerSession } from '@/lib/session/server';

function parseCreateInput(
  raw: unknown
): Extract<ShareAccountActionResult, { ok: false }> | CreateShareAccountInput {
  const parsed = createShareAccountSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }
  return parsed.data;
}

function parseUpdateInput(
  raw: unknown
): Extract<ShareAccountActionResult, { ok: false }> | UpdateShareAccountInput {
  const parsed = updateShareAccountSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }
  return parsed.data;
}

export async function fetchShareAccountTemplateAction(clientId: string, productId?: string) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' } satisfies ShareAccountActionResult;
  }
  try {
    assertCan(session, CREATE_SHARE_ACCOUNT_PERMISSION);
    return await getShareAccountTemplate(clientId, productId);
  } catch (err) {
    return toFineractActionError(err, 'Could not load application template.');
  }
}

export async function fetchShareAccountForModifyAction(accountId: string) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' } satisfies ShareAccountActionResult;
  }
  try {
    assertCan(session, 'UPDATE_SHAREACCOUNT');
    const account = await getShareAccount(accountId, { template: true });
    if (!account) {
      return { ok: false, message: 'Share account not found.' };
    }
    return account;
  } catch (err) {
    return toFineractActionError(err, 'Could not load application for editing.');
  }
}

export async function createShareAccountAction(
  clientId: string,
  raw: unknown
): Promise<ShareAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = parseCreateInput(raw);
  if (isShareAccountActionError(parsed)) {
    return parsed;
  }

  try {
    assertCan(session, CREATE_SHARE_ACCOUNT_PERMISSION);
    const response = await createShareAccountRecord(clientId, parsed);
    const resourceId = response.resourceId;
    revalidatePath(clientAccountListPath(clientId, 'share'));
    revalidatePath(clientShareAccountCreatePath(clientId));
    revalidatePath(`/clients/${clientId}`);
    if (resourceId != null) {
      revalidatePath(clientAccountGeneralPath(clientId, 'share', resourceId));
    }
    return actionSuccessFromFineractCommand(response, { resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Could not submit the application.');
  }
}

export async function updateShareAccountAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<ShareAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = parseUpdateInput(raw);
  if (isShareAccountActionError(parsed)) {
    return parsed;
  }

  try {
    assertCan(session, 'UPDATE_SHAREACCOUNT');
    const response = await updateShareAccountRecord(accountId, parsed);
    revalidatePath(clientAccountListPath(clientId, 'share'));
    revalidatePath(clientAccountGeneralPath(clientId, 'share', accountId));
    revalidatePath(`/clients/${clientId}`);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Could not update the application.');
  }
}
