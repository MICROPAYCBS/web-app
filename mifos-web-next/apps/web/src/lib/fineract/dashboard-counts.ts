import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createFineractClient } from '@/lib/fineract/create-client';

interface PagedTotalResponse {
  totalFilteredRecords?: number;
}

export interface DashboardCounts {
  clients: number | null;
  loans: number | null;
  savings: number | null;
}

async function fetchPagedTotal(path: string): Promise<number | null> {
  try {
    const fineract = await createFineractClient();
    const raw = await fineract.get<PagedTotalResponse>(path, {
      offset: '0',
      limit: '1',
      paged: 'true'
    });
    const total = Number(raw.totalFilteredRecords);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}

export async function fetchDashboardCounts(options: {
  includeClients: boolean;
  includeLoans: boolean;
  includeSavings: boolean;
}): Promise<DashboardCounts> {
  const [clients, loans, savings] = await Promise.all([
    options.includeClients ? fetchPagedTotal('/clients') : Promise.resolve(null),
    options.includeLoans ? fetchPagedTotal('/loans') : Promise.resolve(null),
    options.includeSavings ? fetchPagedTotal('/savingsaccounts') : Promise.resolve(null)
  ]);
  return { clients, loans, savings };
}
