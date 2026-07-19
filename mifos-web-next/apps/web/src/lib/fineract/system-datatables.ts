/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractDatatableRegistration, FineractCommandProcessingResult } from '@mifos/api-client';
import type {
  CreateSystemDatatableInput,
  UpdateSystemDatatableInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import { getDatatableDefinition } from '@/lib/fineract/client-datatables';
import { listSystemCodes, type FineractCodeSummary } from '@/lib/fineract/system-codes';

export { getDatatableDefinition, listSystemCodes, type FineractCodeSummary };

export interface FineractCreateResourceResponse {
  resourceId?: number;
  resourceIdentifier?: string;
}

export async function listSystemDatatables(): Promise<FineractDatatableRegistration[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<FineractDatatableRegistration[]>('/datatables');
  return rows ?? [];
}

export async function createSystemDatatable(
  body: CreateSystemDatatableInput
): Promise<FineractCreateResourceResponse> {
  const fineract = await createFineractClient();
  const payload = {
    ...body,
    entitySubType: body.entitySubType?.trim() || undefined
  };
  return fineract.post<FineractCreateResourceResponse>('/datatables', payload);
}

export async function updateSystemDatatable(
  registeredTableName: string,
  body: UpdateSystemDatatableInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  const payload = {
    ...body,
    entitySubType: body.entitySubType?.trim() || undefined
  };
  return fineract.put<FineractCommandProcessingResult>(`/datatables/${encodeURIComponent(registeredTableName)}`, payload);
}

export async function deleteSystemDatatable(registeredTableName: string): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/datatables/${encodeURIComponent(registeredTableName)}`);
}

export interface SyncDatatableColumnValidationsInput {
  columnValidations: {
    columnName: string;
    validationRegex?: string;
    validationExample?: string;
    validationMessage?: string;
  }[];
  deleteColumnNames?: string[];
}

export async function syncDatatableColumnValidations(
  registeredTableName: string,
  body: SyncDatatableColumnValidationsInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(`/datatables/${encodeURIComponent(registeredTableName)}/columnvalidations`, body);
}
