import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  SmsCampaignDetail,
  SmsCampaignListItem,
  SmsCampaignListPage,
  SmsCampaignMessageByStatusPage,
  SmsCampaignMutationResponse,
  SmsCampaignTemplate
} from '@mifos/api-client';
import type {
  CreateSmsCampaignPayload,
  SmsCampaignActivateCommandInput,
  SmsCampaignCloseCommandInput,
  SmsCampaignMessagesQueryInput,
  UpdateSmsCampaignPayload
} from '@mifos/validation';
import {
  buildCreateSmsCampaignPayload,
  buildSmsCampaignActivatePayload,
  buildSmsCampaignClosePayload,
  buildUpdateSmsCampaignPayload
} from '@/lib/fineract/build-sms-campaign-payload';
import { createFineractClient } from '@/lib/fineract/create-client';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

const BASE_PATH = '/smscampaigns';

export async function listSmsCampaigns(): Promise<SmsCampaignListItem[]> {
  const fineract = await createFineractClient();
  const response = await fineract.get<SmsCampaignListPage | SmsCampaignListItem[]>(BASE_PATH);
  if (Array.isArray(response)) {
    return response;
  }
  return response.pageItems ?? [];
}

export async function getSmsCampaignTemplate(): Promise<SmsCampaignTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<SmsCampaignTemplate>(`${BASE_PATH}/template`);
}

export async function getSmsCampaign(campaignId: string | number): Promise<SmsCampaignDetail> {
  const fineract = await createFineractClient();
  return fineract.get<SmsCampaignDetail>(`${BASE_PATH}/${campaignId}`);
}

export async function createSmsCampaign(
  input: CreateSmsCampaignPayload
): Promise<SmsCampaignMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<SmsCampaignMutationResponse>(BASE_PATH, buildCreateSmsCampaignPayload(input));
}

export async function updateSmsCampaign(
  campaignId: string | number,
  input: UpdateSmsCampaignPayload
): Promise<SmsCampaignMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<SmsCampaignMutationResponse>(
    `${BASE_PATH}/${campaignId}`,
    buildUpdateSmsCampaignPayload(input)
  );
}

export async function deleteSmsCampaign(
  campaignId: string | number
): Promise<SmsCampaignMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<SmsCampaignMutationResponse>(`${BASE_PATH}/${campaignId}`);
}

export async function activateSmsCampaign(
  campaignId: string | number,
  input: SmsCampaignActivateCommandInput
): Promise<SmsCampaignMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<SmsCampaignMutationResponse>(
    `${BASE_PATH}/${campaignId}`,
    buildSmsCampaignActivatePayload(input),
    { command: 'activate' }
  );
}

export async function closeSmsCampaign(
  campaignId: string | number,
  input: SmsCampaignCloseCommandInput
): Promise<SmsCampaignMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<SmsCampaignMutationResponse>(
    `${BASE_PATH}/${campaignId}`,
    buildSmsCampaignClosePayload(input),
    { command: 'close' }
  );
}

export async function reactivateSmsCampaign(
  campaignId: string | number,
  input: SmsCampaignActivateCommandInput
): Promise<SmsCampaignMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<SmsCampaignMutationResponse>(
    `${BASE_PATH}/${campaignId}`,
    buildSmsCampaignActivatePayload(input),
    { command: 'reactivate' }
  );
}

export async function listSmsCampaignMessagesByStatus(
  campaignId: string | number,
  input: SmsCampaignMessagesQueryInput
): Promise<SmsCampaignMessageByStatusPage> {
  const fineract = await createFineractClient();
  const searchParams: Record<string, string> = {
    status: String(input.status),
    locale: input.locale ?? FINERACT_LOCALE,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT
  };
  if (input.fromDate?.trim()) {
    searchParams.fromDate = input.fromDate;
  }
  if (input.toDate?.trim()) {
    searchParams.toDate = input.toDate;
  }
  return fineract.get<SmsCampaignMessageByStatusPage>(
    `/sms/${campaignId}/messageByStatus`,
    searchParams
  );
}
