import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate, CreateClientLoanAccountResponse } from '@mifos/api-client';
import type { CreateLoanAccountInput } from '@mifos/validation';
import { buildLoanAccountPayload, buildLoanGuarantorPayload } from '@/lib/fineract/client-loan-account-payload';
import { normalizeLoanScheduleData } from '@/lib/fineract/loan-schedule-normalize';
import {
  normalizeClientLoanAccountTemplate,
  normalizeLoanCollateralTemplate
} from '@/lib/fineract/client-loan-account-normalize';
import { createFineractClient } from '@/lib/fineract/create-client';

const LOANS_API_PATH = 'loans';

export async function getClientLoanAccountTemplate(
  clientId: string | number,
  productId?: string | number
): Promise<ClientLoanAccountTemplate> {
  const fineract = await createFineractClient();
  const params: Record<string, string> = {
    clientId: String(clientId),
    templateType: 'individual',
    activeOnly: 'true',
    staffInSelectedOfficeOnly: 'true'
  };
  if (productId != null && String(productId).trim() !== '') {
    params.productId = String(productId);
  }
  const raw = await fineract.get<unknown>(`${LOANS_API_PATH}/template`, params);
  const template = normalizeClientLoanAccountTemplate(raw);

  if (productId != null && String(productId).trim() !== '') {
    const collateralTemplate = await getLoanCollateralTemplate(productId);
    return {
      ...template,
      loanCollateralOptions: collateralTemplate.loanCollateralOptions
    };
  }

  return template;
}

export async function getLoanCollateralTemplate(
  productId: string | number
): Promise<ClientLoanAccountTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${LOANS_API_PATH}/template`, {
    fields: 'id,loanCollateralOptions',
    productId: String(productId),
    templateType: 'collateral'
  });
  return normalizeLoanCollateralTemplate(raw);
}

export async function createLoanGuarantorRecord(
  loanId: string | number,
  payload: Record<string, unknown>
): Promise<unknown> {
  const fineract = await createFineractClient();
  return fineract.post(`${LOANS_API_PATH}/${loanId}/guarantors`, payload);
}

export async function createClientLoanAccountRecord(
  clientId: string | number,
  input: CreateLoanAccountInput,
  options?: { linkedToFloatingInterestRates?: boolean }
): Promise<CreateClientLoanAccountResponse> {
  const fineract = await createFineractClient();
  const payload = buildLoanAccountPayload(input, {
    clientId,
    linkedToFloatingInterestRates: options?.linkedToFloatingInterestRates
  });
  const response = await fineract.post<CreateClientLoanAccountResponse>(LOANS_API_PATH, payload);

  const loanId = response.resourceId ?? response.loanId;
  if (loanId != null && input.guarantors.length > 0) {
    for (const guarantor of input.guarantors) {
      await createLoanGuarantorRecord(loanId, buildLoanGuarantorPayload(guarantor));
    }
  }

  return response;
}

export async function calculateClientLoanSchedule(
  clientId: string | number,
  input: CreateLoanAccountInput,
  options?: { linkedToFloatingInterestRates?: boolean }
) {
  const fineract = await createFineractClient();
  const payload = buildLoanAccountPayload(input, {
    clientId,
    linkedToFloatingInterestRates: options?.linkedToFloatingInterestRates,
    forSchedulePreview: true
  });
  const raw = await fineract.post<unknown>(LOANS_API_PATH, payload, {
    command: 'calculateLoanSchedule'
  });
  const schedule = normalizeLoanScheduleData(raw);
  if (!schedule) {
    throw new Error('Could not read repayment schedule.');
  }
  return schedule;
}
