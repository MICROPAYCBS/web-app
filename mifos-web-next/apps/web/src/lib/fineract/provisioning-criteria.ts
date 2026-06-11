/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  ProvisioningCriteriaCreateTemplate,
  ProvisioningCriteriaDetail,
  ProvisioningCriteriaEditTemplate,
  ProvisioningCriteriaListItem,
  ProvisioningCriteriaMutationResponse
} from '@mifos/api-client';
import type { UpsertProvisioningCriteriaPayload } from '@mifos/validation';
import { buildProvisioningCriteriaPayload } from '@/lib/fineract/build-provisioning-criteria-payload';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/provisioningcriteria';

export async function listProvisioningCriteria(): Promise<ProvisioningCriteriaListItem[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<ProvisioningCriteriaListItem[]>(BASE_PATH);
  return rows ?? [];
}

export async function getProvisioningCriteriaCreateTemplate(): Promise<ProvisioningCriteriaCreateTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<ProvisioningCriteriaCreateTemplate>(`${BASE_PATH}/template`);
}

export async function getProvisioningCriteria(
  criteriaId: string | number
): Promise<ProvisioningCriteriaDetail> {
  const fineract = await createFineractClient();
  return fineract.get<ProvisioningCriteriaDetail>(`${BASE_PATH}/${criteriaId}`);
}

export async function getProvisioningCriteriaEditTemplate(
  criteriaId: string | number
): Promise<ProvisioningCriteriaEditTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<ProvisioningCriteriaEditTemplate>(`${BASE_PATH}/${criteriaId}`, {
    template: 'true'
  });
}

export async function createProvisioningCriteria(
  input: UpsertProvisioningCriteriaPayload
): Promise<ProvisioningCriteriaMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<ProvisioningCriteriaMutationResponse>(
    BASE_PATH,
    buildProvisioningCriteriaPayload(input)
  );
}

export async function updateProvisioningCriteria(
  criteriaId: string | number,
  input: UpsertProvisioningCriteriaPayload
): Promise<ProvisioningCriteriaMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<ProvisioningCriteriaMutationResponse>(
    `${BASE_PATH}/${criteriaId}`,
    buildProvisioningCriteriaPayload(input)
  );
}

export async function deleteProvisioningCriteria(
  criteriaId: string | number
): Promise<ProvisioningCriteriaMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<ProvisioningCriteriaMutationResponse>(`${BASE_PATH}/${criteriaId}`);
}
