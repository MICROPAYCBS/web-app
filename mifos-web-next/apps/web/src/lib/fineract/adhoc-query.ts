import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  AdhocQueryDetail,
  AdhocQueryEditTemplate,
  AdhocQueryListItem,
  AdhocQueryMutationResponse,
  AdhocQueryTemplate
} from '@mifos/api-client';
import {
  ADHOC_QUERY_CUSTOM_FREQUENCY_ID,
  type UpsertAdhocQueryPayload
} from '@mifos/validation';
import { enrichAdhocQueryListItem } from '@/lib/fineract/adhoc-query-display';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/adhocquery';

export function buildAdhocQueryPayload(input: UpsertAdhocQueryPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name,
    query: input.query,
    tableName: input.tableName,
    tableFields: input.tableFields,
    isActive: input.isActive ?? false
  };

  if (input.email?.trim()) {
    body.email = input.email.trim();
  }

  if (input.reportRunFrequency != null) {
    body.reportRunFrequency = input.reportRunFrequency;
    if (
      input.reportRunFrequency === ADHOC_QUERY_CUSTOM_FREQUENCY_ID &&
      input.reportRunEvery != null
    ) {
      body.reportRunEvery = input.reportRunEvery;
    }
  }

  return body;
}

export async function listAdhocQueries(): Promise<AdhocQueryListItem[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<AdhocQueryListItem[]>(BASE_PATH);
  return (rows ?? []).map((row) => enrichAdhocQueryListItem(row));
}

export async function getAdhocQueryCreateTemplate(): Promise<AdhocQueryTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<AdhocQueryTemplate>(`${BASE_PATH}/template`);
}

export async function getAdhocQuery(adhocQueryId: string | number): Promise<AdhocQueryDetail> {
  const fineract = await createFineractClient();
  const detail = await fineract.get<AdhocQueryDetail>(`${BASE_PATH}/${adhocQueryId}`);
  return enrichAdhocQueryListItem(detail);
}

export async function getAdhocQueryEditTemplate(
  adhocQueryId: string | number
): Promise<AdhocQueryEditTemplate> {
  const fineract = await createFineractClient();
  const template = await fineract.get<AdhocQueryEditTemplate>(`${BASE_PATH}/${adhocQueryId}`, {
    template: 'true'
  });
  return {
    ...enrichAdhocQueryListItem(template),
    reportRunFrequencies: template.reportRunFrequencies ?? []
  };
}

export async function createAdhocQuery(
  input: UpsertAdhocQueryPayload
): Promise<AdhocQueryMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<AdhocQueryMutationResponse>(BASE_PATH, buildAdhocQueryPayload(input));
}

export async function updateAdhocQuery(
  adhocQueryId: string | number,
  input: UpsertAdhocQueryPayload
): Promise<AdhocQueryMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<AdhocQueryMutationResponse>(
    `${BASE_PATH}/${adhocQueryId}`,
    buildAdhocQueryPayload(input)
  );
}

export async function deleteAdhocQuery(
  adhocQueryId: string | number
): Promise<AdhocQueryMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<AdhocQueryMutationResponse>(`${BASE_PATH}/${adhocQueryId}`);
}
