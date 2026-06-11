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
  createDelinquencyBucketSchema,
  toFineractActionError,
  updateDelinquencyBucketSchema,
  type CreateDelinquencyBucketInput,
  type UpdateDelinquencyBucketInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type { DelinquencyActionResult } from '@/lib/fineract/delinquency-action-result';
import {
  createDelinquencyBucket,
  deleteDelinquencyBucket,
  updateDelinquencyBucket
} from '@/lib/fineract/delinquency-buckets';
import {
  delinquencyBucketDetailPath,
  delinquencyBucketEditPath,
  delinquencyBucketsListPath
} from '@/lib/fineract/delinquency-paths';
import { getServerSession } from '@/lib/session/server';

function parseFieldErrors(error: { issues: Array<{ path: Array<string | number>; message: string }> }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function parseCreateInput(raw: unknown): DelinquencyActionResult | CreateDelinquencyBucketInput {
  const parsed = createDelinquencyBucketSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: parseFieldErrors(parsed.error)
    };
  }
  return parsed.data;
}

function parseUpdateInput(raw: unknown): DelinquencyActionResult | UpdateDelinquencyBucketInput {
  const parsed = updateDelinquencyBucketSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: parseFieldErrors(parsed.error)
    };
  }
  return parsed.data;
}

export async function createDelinquencyBucketAction(raw: unknown): Promise<DelinquencyActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.delinquency.buckets.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create delinquency buckets.' };
  }

  const parsed = parseCreateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createDelinquencyBucket(parsed);
    const resourceId = response.resourceId;
    revalidatePath(delinquencyBucketsListPath());
    if (resourceId) {
      revalidatePath(delinquencyBucketDetailPath(resourceId));
    }
    return { ok: true, resourceId };
  } catch (err) {
    return toFineractActionError(err, 'Could not create delinquency bucket.');
  }
}

export async function updateDelinquencyBucketAction(
  bucketId: string,
  raw: unknown
): Promise<DelinquencyActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.delinquency.buckets.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update delinquency buckets.' };
  }

  const parsed = parseUpdateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    await updateDelinquencyBucket(bucketId, parsed);
    revalidatePath(delinquencyBucketsListPath());
    revalidatePath(delinquencyBucketDetailPath(bucketId));
    revalidatePath(delinquencyBucketEditPath(bucketId, 'regular'));
    revalidatePath(delinquencyBucketEditPath(bucketId, 'workingcapital'));
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Could not update delinquency bucket.');
  }
}

export async function deleteDelinquencyBucketAction(bucketId: string): Promise<DelinquencyActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.delinquency.buckets.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete delinquency buckets.' };
  }

  try {
    await deleteDelinquencyBucket(bucketId);
    revalidatePath(delinquencyBucketsListPath());
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Could not delete delinquency bucket.');
  }
}
