import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BulkImportHistoryItem, BulkImportStaffOption } from '@mifos/api-client';
import { FineractHttpError } from '@mifos/api-client';
import type { BulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { buildFineractRequestInit, fineractUrl } from '@/lib/fineract/fineract-fetch';
import { getFineractServerConfig } from '@/lib/fineract/server-config';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeStaffOptions(value: unknown): BulkImportStaffOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      const displayName =
        typeof row.displayName === 'string'
          ? row.displayName
          : typeof row.firstname === 'string' && typeof row.lastname === 'string'
            ? `${row.firstname} ${row.lastname}`.trim()
            : '';
      if (!Number.isFinite(id) || !displayName) {
        return null;
      }
      return { id, displayName };
    })
    .filter((item): item is BulkImportStaffOption => item !== null);
}

function normalizeImportHistory(value: unknown): BulkImportHistoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: BulkImportHistoryItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const importId = Number(row.importId ?? row.id);
    const name = typeof row.name === 'string' ? row.name : '';
    if (!Number.isFinite(importId) || !name) {
      continue;
    }
    items.push({
      importId,
      name,
      importTime: row.importTime as BulkImportHistoryItem['importTime'],
      endTime: row.endTime as BulkImportHistoryItem['endTime'],
      completed: row.completed as BulkImportHistoryItem['completed'],
      totalRecords:
        typeof row.totalRecords === 'number' ? row.totalRecords : Number(row.totalRecords),
      successCount:
        typeof row.successCount === 'number' ? row.successCount : Number(row.successCount),
      failureCount:
        typeof row.failureCount === 'number' ? row.failureCount : Number(row.failureCount)
    });
  }
  return items;
}

export async function listBulkImportHistory(entityType: string): Promise<BulkImportHistoryItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/imports', { entityType });
  return normalizeImportHistory(raw);
}

export async function listActiveStaffByOffice(
  officeId: string | number
): Promise<BulkImportStaffOption[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/staff', {
    officeId: String(officeId),
    status: 'active'
  });
  return normalizeStaffOptions(raw);
}

function templateSearchParams(options: {
  officeId?: string;
  staffId?: string;
  legalFormType?: string;
  tenantId: string;
}) {
  const params = new URLSearchParams({
    tenantIdentifier: options.tenantId,
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  });
  if (options.officeId) {
    params.set('officeId', options.officeId);
  }
  if (options.staffId) {
    params.set('staffId', options.staffId);
  }
  if (options.legalFormType) {
    params.set('legalFormType', options.legalFormType);
  }
  return params;
}

export async function fetchBulkImportTemplate(
  definition: BulkImportDefinition,
  options: {
    officeId?: string;
    staffId?: string;
    legalFormType?: string;
  }
): Promise<Response> {
  const { tenantId } = await getFineractServerConfig();
  const { urlBase, init } = await buildFineractRequestInit();
  const params = templateSearchParams({ ...options, tenantId });
  return fetch(
    `${fineractUrl(urlBase, `${definition.urlSuffix}/downloadtemplate`)}?${params.toString()}`,
    init
  );
}

export async function fetchBulkImportOutputDocument(
  importDocumentId: string | number
): Promise<Response> {
  const { tenantId } = await getFineractServerConfig();
  const { urlBase, init } = await buildFineractRequestInit();
  const params = new URLSearchParams({
    importDocumentId: String(importDocumentId),
    tenantIdentifier: tenantId
  });
  return fetch(
    `${fineractUrl(urlBase, '/imports/downloadOutputTemplate')}?${params.toString()}`,
    init
  );
}

export async function uploadBulkImportTemplate(
  definition: BulkImportDefinition,
  file: File,
  legalFormType?: string
): Promise<void> {
  const { urlBase, init } = await buildFineractRequestInit({ method: 'POST' });
  const formData = new FormData();
  formData.append('file', file);
  formData.append('locale', FINERACT_LOCALE);
  formData.append('dateFormat', FINERACT_DATE_FORMAT);

  const params = new URLSearchParams();
  if (legalFormType) {
    params.set('legalFormType', legalFormType);
  }

  const headers = new Headers(init.headers);
  const query = params.toString();
  const url = `${fineractUrl(urlBase, `${definition.urlSuffix}/uploadtemplate`)}${query ? `?${query}` : ''}`;
  const res = await fetch(url, {
    ...init,
    headers,
    body: formData
  });

  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new FineractHttpError(res.status, body);
  }
}

