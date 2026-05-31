/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  FineractClientDetail,
  FineractClientsPage,
  FineractClientTemplate,
  FineractCreateClientResponse
} from '@mifos/api-client';
import type { CreateClientPayload } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

export interface ListClientsParams {
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export async function listClients(params: ListClientsParams = {}): Promise<FineractClientsPage> {
  const fineract = await createFineractClient();
  const searchParams: Record<string, string> = {
    offset: String(params.offset ?? 0),
    limit: String(params.limit ?? 25)
  };
  if (params.orderBy) {
    searchParams.orderBy = params.orderBy;
    searchParams.sortOrder = params.sortOrder ?? 'ASC';
  }
  return fineract.get<FineractClientsPage>('/clients', searchParams);
}

export async function getClient(clientId: string | number): Promise<FineractClientDetail> {
  const fineract = await createFineractClient();
  return fineract.get<FineractClientDetail>(`/clients/${clientId}`);
}

export async function getClientTemplate(officeId?: number): Promise<FineractClientTemplate> {
  const fineract = await createFineractClient();
  const searchParams =
    officeId != null
      ? { officeId: String(officeId), staffInSelectedOfficeOnly: 'true' }
      : undefined;
  return fineract.get<FineractClientTemplate>('/clients/template', searchParams);
}

export function buildCreateClientPayload(input: CreateClientPayload) {
  return {
    ...input,
    legalFormId: 1,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT,
    locale: input.locale ?? FINERACT_LOCALE
  };
}

export async function createClient(
  input: CreateClientPayload
): Promise<FineractCreateClientResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCreateClientResponse>('/clients', buildCreateClientPayload(input));
}
