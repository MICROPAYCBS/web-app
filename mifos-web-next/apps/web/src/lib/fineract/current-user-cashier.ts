import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationCashierListItem } from '@mifos/api-client';
import { getUser } from '@/lib/fineract/app-users';
import {
  getOrganizationCashierSummary,
  listOrganizationCashiers
} from '@/lib/fineract/cashiers';
import type {
  AccountCashierKind,
  AccountCashierSnapshot
} from '@/lib/fineract/cashier-display';
import {
  cashierAssignmentStatus,
  filterCashierTransactionsForAccount,
  sortCashierTransactions
} from '@/lib/fineract/cashier-display';
import { listOrganizationTellers } from '@/lib/fineract/tellers';

interface CashierMatch {
  tellerId: number;
  tellerName?: string;
  cashier: OrganizationCashierListItem;
}

async function findCashierForStaff(
  staffId: number,
  officeId: number
): Promise<CashierMatch | null> {
  const tellers = (await listOrganizationTellers()).filter(
    (teller) => teller.officeId == null || teller.officeId === officeId
  );

  const matches: CashierMatch[] = [];

  await Promise.all(
    tellers.map(async (teller) => {
      const cashiers = await listOrganizationCashiers(teller.id);
      for (const cashier of cashiers) {
        if (cashier.staffId === staffId) {
          matches.push({
            tellerId: teller.id,
            tellerName: teller.name,
            cashier
          });
        }
      }
    })
  );

  if (matches.length === 0) {
    return null;
  }

  const active = matches.find(
    (match) => cashierAssignmentStatus(match.cashier) === 'active'
  );
  if (active) {
    return active;
  }

  const scheduled = matches.find(
    (match) => cashierAssignmentStatus(match.cashier) === 'scheduled'
  );
  if (scheduled) {
    return scheduled;
  }

  return matches[0];
}

export async function loadCurrentUserAccountCashier(options: {
  userId: number;
  officeId: number;
  accountId: number;
  accountKind: AccountCashierKind;
  currencyCode: string;
  canOpenCashierDetail: boolean;
}): Promise<AccountCashierSnapshot | null> {
  const user = await getUser(options.userId);
  const staffId = user?.staff?.id;
  if (!staffId) {
    return null;
  }

  const match = await findCashierForStaff(staffId, options.officeId);
  if (!match) {
    return null;
  }

  const summary = await getOrganizationCashierSummary(
    match.tellerId,
    match.cashier.id,
    options.currencyCode
  );

  const sessionTransactions = sortCashierTransactions(
    summary.cashierTransactions?.pageItems ?? []
  );

  return {
    tellerId: match.tellerId,
    tellerName: match.tellerName ?? summary.tellerName,
    cashier: match.cashier,
    assignmentStatus: cashierAssignmentStatus(match.cashier),
    currencyCode: options.currencyCode,
    summary,
    accountTransactions: filterCashierTransactionsForAccount(
      sessionTransactions,
      options.accountId,
      options.accountKind
    ),
    sessionTransactions,
    canOpenCashierDetail: options.canOpenCashierDetail
  };
}
