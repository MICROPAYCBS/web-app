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
  validateCreateCustomerClass,
  validateUpdateCustomerClass,
  type UpdateCustomerClassInput,
  type UpsertCustomerClassInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { EmptyUpdatePayloadError } from '@/lib/fineract/partial-update-payload';
import {
  CUSTOMER_CLASS_LIST_PATH,
  customerClassEditPath,
  customerClassLegacyEditPath
} from '@/lib/fineract/customer-class-paths';
import {
  createCustomerClass,
  deleteCustomerClass,
  updateCustomerClass
} from '@/lib/fineract/customer-classes';
import { getServerSession } from '@/lib/session/server';

export type CustomerClassActionResult =
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

function revalidateCustomerClassViews(customerClassId?: number) {
  revalidatePath(CUSTOMER_CLASS_LIST_PATH);
  if (customerClassId != null) {
    revalidatePath(customerClassEditPath(customerClassId));
    revalidatePath(customerClassLegacyEditPath(customerClassId));
  }
}

export async function createCustomerClassAction(
  input: UpsertCustomerClassInput
): Promise<CustomerClassActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_CUSTOMERCLASS');
  } catch {
    return { ok: false, message: 'You do not have permission to create customer classes.' };
  }

  const parsed = validateCreateCustomerClass(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createCustomerClass(parsed.data);
    revalidateCustomerClassViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create customer class.');
  }
}

export async function updateCustomerClassAction(
  customerClassId: number,
  input: UpdateCustomerClassInput,
  initialSnapshot: UpdateCustomerClassInput
): Promise<CustomerClassActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CUSTOMERCLASS');
  } catch {
    return { ok: false, message: 'You do not have permission to update customer classes.' };
  }

  const parsed = validateUpdateCustomerClass(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  const initialParsed = validateUpdateCustomerClass(initialSnapshot);
  if (!initialParsed.success) {
    return { ok: false, message: 'Could not verify customer class changes.' };
  }

  try {
    const response = await updateCustomerClass(customerClassId, parsed.data, {
      initial: initialParsed.data
    });
    revalidateCustomerClassViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    if (error instanceof EmptyUpdatePayloadError) {
      return { ok: false, message: error.message };
    }
    return toFineractActionError(error, 'Failed to update customer class.');
  }
}

export async function deleteCustomerClassAction(
  customerClassId: number
): Promise<CustomerClassActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_CUSTOMERCLASS');
  } catch {
    return { ok: false, message: 'You do not have permission to delete customer classes.' };
  }

  try {
    await deleteCustomerClass(customerClassId);
    revalidateCustomerClassViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete customer class.');
  }
}
