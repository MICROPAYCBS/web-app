/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { cache } from 'react';

import type {
  FineractAddressFieldConfig,
  FineractClientDetail,
  FineractClientsPage,
  FineractClientTemplate,
  FineractCreateClientResponse
} from '@mifos/api-client';
import type { CreateClientPayload } from '@mifos/validation';
import { buildCreateClientPayload } from '@/lib/fineract/build-create-client-payload';
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

export const getClient = cache(async (clientId: string | number): Promise<FineractClientDetail> => {
  const fineract = await createFineractClient();
  return fineract.get<FineractClientDetail>(`/clients/${clientId}`);
});

export async function getClientTemplate(officeId?: number): Promise<FineractClientTemplate> {
  const fineract = await createFineractClient();
  const searchParams =
    officeId != null
      ? { officeId: String(officeId), staffInSelectedOfficeOnly: 'true' }
      : undefined;
  return fineract.get<FineractClientTemplate>('/clients/template', searchParams);
}

export async function getAddressFieldConfiguration(): Promise<FineractAddressFieldConfig[]> {
  const fineract = await createFineractClient();
  return fineract.get<FineractAddressFieldConfig[]>('/fieldconfiguration/ADDRESS');
}

export async function createClient(
  input: CreateClientPayload
): Promise<FineractCreateClientResponse> {
  const fineract = await createFineractClient();
  const body = buildCreateClientPayload(input);
  return fineract.post<FineractCreateClientResponse>('/clients', body);
}
