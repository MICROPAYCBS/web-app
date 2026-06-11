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
  validateCreatePaymentType,
  validateUpdatePaymentType,
  type CreatePaymentTypeInput,
  type UpdatePaymentTypeInput,
  type UpdateSystemPaymentTypeInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  PAYMENT_TYPE_LIST_PATH,
  paymentTypeEditPath
} from '@/lib/fineract/payment-type-paths';
import {
  createOrganizationPaymentType,
  deleteOrganizationPaymentType,
  updateOrganizationPaymentType
} from '@/lib/fineract/payment-types';
import { getServerSession } from '@/lib/session/server';

export type PaymentTypeActionResult =
  | { ok: true; paymentTypeId?: number }
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

function revalidatePaymentTypeViews(paymentTypeId: string | number) {
  revalidatePath(PAYMENT_TYPE_LIST_PATH);
  revalidatePath(paymentTypeEditPath(paymentTypeId));
}

export async function createPaymentTypeAction(
  input: CreatePaymentTypeInput
): Promise<PaymentTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_PAYMENTTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to create payment types.' };
  }

  const parsed = validateCreatePaymentType(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createOrganizationPaymentType(parsed.data);
    revalidatePath(PAYMENT_TYPE_LIST_PATH);
    return { ok: true, paymentTypeId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create payment type.');
  }
}

export async function updatePaymentTypeAction(
  paymentTypeId: string | number,
  input: UpdatePaymentTypeInput | UpdateSystemPaymentTypeInput,
  isSystemDefined: boolean
): Promise<PaymentTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_PAYMENTTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to update payment types.' };
  }

  const parsed = validateUpdatePaymentType(input, isSystemDefined);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateOrganizationPaymentType(paymentTypeId, parsed.data);
    revalidatePaymentTypeViews(paymentTypeId);
    return { ok: true, paymentTypeId: response.resourceId ?? Number(paymentTypeId) };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update payment type.');
  }
}

export async function deletePaymentTypeAction(
  paymentTypeId: string | number
): Promise<PaymentTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_PAYMENTTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete payment types.' };
  }

  try {
    await deleteOrganizationPaymentType(paymentTypeId);
    revalidatePath(PAYMENT_TYPE_LIST_PATH);
    return { ok: true, paymentTypeId: Number(paymentTypeId) };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete payment type.');
  }
}
