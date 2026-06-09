'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductKind } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import { toFineractActionError, upsertDepositProductSchema } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type { DepositProductActionResult } from '@/lib/fineract/deposit-product-action-result';
import {
  depositProductConfig,
  depositProductDetailPath
} from '@/lib/fineract/deposit-product-config';
import { buildDepositProductPayload } from '@/lib/fineract/deposit-product-payload';
import {
  createDepositProductRecord,
  getDepositProductChargeOptions,
  updateDepositProductRecord
} from '@/lib/fineract/deposit-products';
import { getServerSession } from '@/lib/session/server';

function parseInput(
  raw: unknown
): DepositProductActionResult | ReturnType<typeof upsertDepositProductSchema.parse> {
  const parsed = upsertDepositProductSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (key) {
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

export async function fetchDepositProductChargeOptionsAction(
  kind: DepositProductKind,
  currencyCode: string
) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: 'You must be signed in.' };
  }
  try {
    assertCan(
      session,
      resolvePermission(
        kind === 'recurring' ? 'products.recurringDeposit' : 'products.fixedDeposit'
      )
    );
  } catch {
    return { ok: false as const, message: 'You do not have permission to view charge options.' };
  }

  const code = currencyCode.trim();
  if (!code) {
    return { ok: false as const, message: 'Select a currency first.' };
  }

  try {
    const options = await getDepositProductChargeOptions(kind, code);
    return { ok: true as const, ...options };
  } catch (err) {
    return toFineractActionError(err, 'Could not load charge options.');
  }
}

export async function createDepositProductAction(
  kind: DepositProductKind,
  raw: unknown
): Promise<DepositProductActionResult> {
  const config = depositProductConfig(kind);
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(
      session,
      resolvePermission(
        kind === 'recurring'
          ? 'products.recurringDeposit.create'
          : 'products.fixedDeposit.create'
      )
    );
  } catch {
    return { ok: false, message: `You do not have permission to create ${config.labelPlural.toLowerCase()}.` };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const payload = buildDepositProductPayload(parsed);
    const response = await createDepositProductRecord(kind, payload);
    revalidatePath(config.listPath);
    if (response.resourceId) {
      revalidatePath(depositProductDetailPath(kind, response.resourceId));
    }
    return { ok: true, resourceId: response.resourceId };
  } catch (err) {
    return toFineractActionError(err, `Could not create ${config.label.toLowerCase()}.`);
  }
}

export async function updateDepositProductAction(
  kind: DepositProductKind,
  productId: string,
  raw: unknown
): Promise<DepositProductActionResult> {
  const config = depositProductConfig(kind);
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(
      session,
      resolvePermission(
        kind === 'recurring'
          ? 'products.recurringDeposit.update'
          : 'products.fixedDeposit.update'
      )
    );
  } catch {
    return { ok: false, message: `You do not have permission to update ${config.labelPlural.toLowerCase()}.` };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const payload = buildDepositProductPayload(parsed);
    await updateDepositProductRecord(kind, productId, payload);
    revalidatePath(config.listPath);
    revalidatePath(depositProductDetailPath(kind, productId));
    revalidatePath(`${depositProductDetailPath(kind, productId)}/edit`);
    return { ok: true, resourceId: Number(productId) };
  } catch (err) {
    return toFineractActionError(err, `Could not update ${config.label.toLowerCase()}.`);
  }
}
