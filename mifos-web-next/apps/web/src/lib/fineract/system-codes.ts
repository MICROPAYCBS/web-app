/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  FineractCode,
  FineractCodeValue,
  FineractCreateCodeResponse,
  FineractCreateCodeValueResponse
} from '@mifos/api-client';
import type { CreateCodeInput, UpdateCodeInput, UpsertCodeValuePayload } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

export type FineractCodeSummary = Pick<FineractCode, 'id' | 'name'>;

export function codeValueIsActive(value: FineractCodeValue): boolean {
  return value.isActive ?? value.active ?? false;
}

export function buildCodeValuePayload(input: UpsertCodeValuePayload): Record<string, unknown> {
  return {
    name: input.name,
    description: input.description?.trim() || undefined,
    position: input.position,
    isActive: input.isActive
  };
}

export async function listCodes(): Promise<FineractCode[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<FineractCode[]>('/codes');
  return rows ?? [];
}

/** Summary list for dropdowns (e.g. data table column code lookup). */
export async function listSystemCodes(): Promise<FineractCodeSummary[]> {
  const codes = await listCodes();
  return codes.map((code) => ({ id: code.id, name: code.name }));
}

export async function getCode(codeId: string | number): Promise<FineractCode> {
  const fineract = await createFineractClient();
  return fineract.get<FineractCode>(`/codes/${codeId}`);
}

export async function createCode(body: CreateCodeInput): Promise<FineractCreateCodeResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCreateCodeResponse>('/codes', body);
}

export async function updateCode(
  codeId: string | number,
  body: UpdateCodeInput
): Promise<FineractCreateCodeResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCreateCodeResponse>(`/codes/${codeId}`, body);
}

export async function deleteCode(codeId: string | number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`/codes/${codeId}`);
}

export async function listCodeValues(codeId: string | number): Promise<FineractCodeValue[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<FineractCodeValue[]>(`/codes/${codeId}/codevalues`);
  return rows ?? [];
}

export async function createCodeValue(
  codeId: string | number,
  body: UpsertCodeValuePayload
): Promise<FineractCreateCodeValueResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCreateCodeValueResponse>(
    `/codes/${codeId}/codevalues`,
    buildCodeValuePayload(body)
  );
}

export async function updateCodeValue(
  codeId: string | number,
  codeValueId: string | number,
  body: UpsertCodeValuePayload
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put(`/codes/${codeId}/codevalues/${codeValueId}`, buildCodeValuePayload(body));
}

export async function deleteCodeValue(
  codeId: string | number,
  codeValueId: string | number
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`/codes/${codeId}/codevalues/${codeValueId}`);
}

export async function listCodeValuesByName(codeName: string): Promise<FineractCodeValue[]> {
  const codes = await listCodes();
  const match = codes.find((code) => code.name === codeName);
  if (!match) {
    return [];
  }
  return listCodeValues(match.id);
}
