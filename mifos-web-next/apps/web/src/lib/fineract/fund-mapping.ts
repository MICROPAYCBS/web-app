import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FundMappingAdvanceSearchTemplate,
  FundMappingSearchResultItem
} from '@mifos/api-client';
import type { FundMappingSearchPayload } from '@mifos/validation';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField
} from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

export const FUND_MAPPING_PATH = '/organization/fund-mapping';

function asLoanProducts(value: unknown): FundMappingAdvanceSearchTemplate['loanProducts'] {
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
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function asOffices(value: unknown): FundMappingAdvanceSearchTemplate['offices'] {
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
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function normalizeResultItem(raw: unknown): FundMappingSearchResultItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    loanProductName:
      typeof row.loanProductName === 'string'
        ? row.loanProductName
        : typeof row.productName === 'string'
          ? row.productName
          : undefined,
    count: Number.isFinite(Number(row.count)) ? Number(row.count) : undefined,
    loanOutStanding: Number.isFinite(Number(row.loanOutStanding))
      ? Number(row.loanOutStanding)
      : undefined,
    percentage: Number.isFinite(Number(row.percentage)) ? Number(row.percentage) : undefined
  };
}

export async function getFundMappingAdvanceSearchTemplate(): Promise<FundMappingAdvanceSearchTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<Record<string, unknown>>('/search/template');
  return {
    loanProducts: asLoanProducts(raw.loanProducts),
    offices: asOffices(raw.offices)
  };
}

export function buildFundMappingSearchBody(input: FundMappingSearchPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    entities: ['loans'],
    locale: input.locale ?? FINERACT_LOCALE,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT,
    loanDateOption: input.loanDateOption,
    loanFromDate: normalizeFineractDateField(input.loanFromDate),
    loanToDate: normalizeFineractDateField(input.loanToDate),
    includeOutStandingAmountPercentage: input.includeOutStandingAmountPercentage,
    includeOutstandingAmount: input.includeOutstandingAmount
  };

  if (input.loanStatus.length) {
    body.loanStatus = input.loanStatus;
  }
  if (input.loanProducts.length) {
    body.loanProducts = input.loanProducts;
  }
  if (input.offices.length) {
    body.offices = input.offices;
  }

  if (input.includeOutStandingAmountPercentage && input.outStandingAmountPercentageCondition) {
    body.outStandingAmountPercentageCondition = input.outStandingAmountPercentageCondition;
    if (input.outStandingAmountPercentageCondition === 'between') {
      body.minOutStandingAmountPercentage = input.minOutStandingAmountPercentage;
      body.maxOutStandingAmountPercentage = input.maxOutStandingAmountPercentage;
    } else {
      body.outStandingAmountPercentage = input.outStandingAmountPercentage;
    }
  }

  if (input.includeOutstandingAmount && input.outstandingAmountCondition) {
    body.outstandingAmountCondition = input.outstandingAmountCondition;
    if (input.outstandingAmountCondition === 'between') {
      body.minOutstandingAmount = input.minOutstandingAmount;
      body.maxOutstandingAmount = input.maxOutstandingAmount;
    } else {
      body.outstandingAmount = input.outstandingAmount;
    }
  }

  return body;
}

export async function searchFundMappingLoans(
  input: FundMappingSearchPayload
): Promise<FundMappingSearchResultItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<unknown>('/search/advance', buildFundMappingSearchBody(input));
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeResultItem(item))
    .filter((item): item is FundMappingSearchResultItem => item !== null);
}
