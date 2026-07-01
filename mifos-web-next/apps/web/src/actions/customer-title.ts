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
  validateCreateCustomerTitle,
  validateUpdateCustomerTitle,
  type CustomerTitleUpdateClearFields,
  type UpdateCustomerTitleInput,
  type UpsertCustomerTitleInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  CUSTOMER_TITLE_LIST_PATH,
  customerTitleEditPath
} from '@/lib/fineract/customer-title-paths';
import {
  createCustomerTitle,
  deleteCustomerTitle,
  updateCustomerTitle
} from '@/lib/fineract/customer-titles';
import { getServerSession } from '@/lib/session/server';

export type CustomerTitleActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateCustomerTitleViews(customerTitleId?: number) {
  revalidatePath(CUSTOMER_TITLE_LIST_PATH);
  if (customerTitleId != null) {
    revalidatePath(customerTitleEditPath(customerTitleId));
  }
}

export async function createCustomerTitleAction(
  input: UpsertCustomerTitleInput
): Promise<CustomerTitleActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_CLIENTTITLE');
  } catch {
    return { ok: false, message: 'You do not have permission to create customer titles.' };
  }

  const parsed = validateCreateCustomerTitle(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createCustomerTitle(parsed.data);
    revalidateCustomerTitleViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create customer title.');
  }
}

export async function updateCustomerTitleAction(
  customerTitleId: number,
  input: UpdateCustomerTitleInput,
  clear: CustomerTitleUpdateClearFields
): Promise<CustomerTitleActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CLIENTTITLE');
  } catch {
    return { ok: false, message: 'You do not have permission to update customer titles.' };
  }

  const parsed = validateUpdateCustomerTitle(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateCustomerTitle(customerTitleId, parsed.data, clear);
    revalidateCustomerTitleViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update customer title.');
  }
}

export async function deleteCustomerTitleAction(
  customerTitleId: number
): Promise<CustomerTitleActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_CLIENTTITLE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete customer titles.' };
  }

  try {
    const response = await deleteCustomerTitle(customerTitleId);
    revalidateCustomerTitleViews();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete customer title.');
  }
}
