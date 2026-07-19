import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanListItem, LoansPage } from '@mifos/api-client';
import type { PortfolioListQuery } from '@/lib/fineract/portfolio-list-query';
import { buildPortfolioListApiQuery } from '@/lib/fineract/portfolio-list-query';
import { isClosedLoanAccount } from '@/lib/fineract/client-accounts';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeLoanListItem(raw: unknown): LoanListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const accountNo = typeof row.accountNo === 'string' ? row.accountNo : '';
  if (!Number.isFinite(id) || !accountNo) {
    return null;
  }

  const clientId = Number(row.clientId);
  const productName =
    typeof row.loanProductName === 'string'
      ? row.loanProductName
      : typeof row.productName === 'string'
        ? row.productName
        : undefined;

  return {
    id,
    accountNo,
    clientId: Number.isFinite(clientId) ? clientId : undefined,
    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,
    productName,
    status:
      row.status && typeof row.status === 'object'
        ? (row.status as LoanListItem['status'])
        : undefined,
    currency:
      row.currency && typeof row.currency === 'object'
        ? (row.currency as LoanListItem['currency'])
        : undefined,
    loanBalance:
      typeof row.loanBalance === 'number'
        ? row.loanBalance
        : row.loanBalance != null
          ? Number(row.loanBalance)
          : undefined,
    inArrears: row.inArrears === true,
    officeName:
      typeof row.clientOfficeName === 'string'
        ? row.clientOfficeName
        : typeof row.officeName === 'string'
          ? row.officeName
          : undefined
  };
}

export async function fetchLoansList(query: PortfolioListQuery): Promise<LoansPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<LoansPage>('/loans', buildPortfolioListApiQuery(query));
  let pageItems = Array.isArray(raw.pageItems)
    ? raw.pageItems
        .map((item) => normalizeLoanListItem(item))
        .filter((item): item is LoanListItem => item !== null)
    : [];

  if (!query.includeClosed) {
    pageItems = pageItems.filter((loan) => !isClosedLoanAccount(loan.status?.code));
  }

  return {
    totalFilteredRecords: Number.isFinite(Number(raw.totalFilteredRecords))
      ? Number(raw.totalFilteredRecords)
      : pageItems.length,
    pageItems
  };
}
