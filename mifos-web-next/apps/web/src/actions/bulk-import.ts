'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BulkImportHistoryItem, BulkImportStaffOption } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import { toFineractActionError } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { getBulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { resolveClientLegalFormTypeFromFilename } from '@/lib/fineract/bulk-import-display';
import {
  listActiveStaffByOffice,
  listBulkImportHistory,
  uploadBulkImportTemplate
} from '@/lib/fineract/bulk-import';
import { bulkImportDetailPath } from '@/lib/fineract/bulk-import-paths';
import { getServerSession } from '@/lib/session/server';

export type BulkImportActionResult = { ok: true } | { ok: false; message: string };

export type BulkImportDataResult<T> = { ok: true; data: T } | { ok: false; message: string };

function assertBulkImportAccess(session: Awaited<ReturnType<typeof getServerSession>>) {
  assertCan(session, resolvePermission('organization.bulkImport'));
}

export async function loadBulkImportStaffAction(
  officeId: string | number
): Promise<BulkImportDataResult<BulkImportStaffOption[]>> {
  const session = await getServerSession();
  try {
    assertBulkImportAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to access bulk import.' };
  }

  try {
    const data = await listActiveStaffByOffice(officeId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load staff for the selected branch.');
  }
}

export async function refreshBulkImportHistoryAction(
  importName: string
): Promise<BulkImportDataResult<BulkImportHistoryItem[]>> {
  const session = await getServerSession();
  const definition = getBulkImportDefinition(importName);
  if (!definition) {
    return { ok: false, message: 'Unknown bulk import type.' };
  }

  try {
    assertBulkImportAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to access bulk import.' };
  }

  try {
    const data = await listBulkImportHistory(definition.entityType);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to refresh import history.');
  }
}

export async function uploadBulkImportFileAction(
  importName: string,
  formData: FormData
): Promise<BulkImportActionResult> {
  const session = await getServerSession();
  const definition = getBulkImportDefinition(importName);
  if (!definition) {
    return { ok: false, message: 'Unknown bulk import type.' };
  }

  try {
    assertBulkImportAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to access bulk import.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Select an Excel file to upload.' };
  }

  let legalFormType: string | undefined;
  if (definition.name === 'Clients') {
    legalFormType = resolveClientLegalFormTypeFromFilename(file.name);
  }

  try {
    await uploadBulkImportTemplate(definition, file, legalFormType);
    revalidatePath(bulkImportDetailPath(definition.name));
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to upload import file.');
  }
}
