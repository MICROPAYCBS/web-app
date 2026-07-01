/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractCreateEntityDatatableCheckPayload,
  FineractCreateResourceResponse,
  FineractEntityDatatableChecksPage,
  FineractEntityDatatableCheckTemplate, FineractCommandProcessingResult } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

export async function listEntityDatatableChecks(): Promise<FineractEntityDatatableChecksPage> {
  const fineract = await createFineractClient();
  const page = await fineract.get<FineractEntityDatatableChecksPage>('/entityDatatableChecks', {
    limit: '-1',
    offset: '0'
  });
  return page ?? { totalFilteredRecords: 0, pageItems: [] };
}

export async function getEntityDatatableCheckTemplate(): Promise<FineractEntityDatatableCheckTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<FineractEntityDatatableCheckTemplate>('/entityDatatableChecks/template');
}

export async function createEntityDatatableCheck(
  body: FineractCreateEntityDatatableCheckPayload
): Promise<FineractCreateResourceResponse> {
  const fineract = await createFineractClient();
  const payload = {
    ...body,
    productId: body.productId ?? undefined
  };
  return fineract.post<FineractCreateResourceResponse>('/entityDatatableChecks', payload);
}

export async function deleteEntityDatatableCheck(id: number | string): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/entityDatatableChecks/${id}`);
}
