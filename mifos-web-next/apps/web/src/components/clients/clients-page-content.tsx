'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientSummary, FineractOfficeOption } from '@mifos/api-client';
import { Can, resolvePermission } from '@mifos/auth';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ClientsFilterSheet } from '@/components/clients/clients-filter-sheet';
import { ClientsTable } from '@/components/clients/clients-table';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import {
  clientListFiltersSignature,
  countActiveClientListFilters,
  type ClientListFilters
} from '@/lib/fineract/clients-table-filter';
import { cn } from '@/lib/utils';

export function ClientsPageContent({
  clients,
  offices,
  truncated,
  totalRecords
}: {
  clients: FineractClientSummary[];
  offices: FineractOfficeOption[];
  truncated?: boolean;
  totalRecords?: number;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ClientListFilters>({});
  const [draftFilters, setDraftFilters] = useState<ClientListFilters>({});

  const appliedFiltersSignature = useMemo(
    () => clientListFiltersSignature(appliedFilters),
    [appliedFilters]
  );
  const activeFilterCount = countActiveClientListFilters(appliedFilters);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFiltersSignature, appliedFilters]);

  function handleApplyFilters(nextFilters: ClientListFilters) {
    setAppliedFilters(nextFilters);
  }

  function handleClearFilters() {
    setAppliedFilters({});
  }

  return (
    <>
      <ListPage
        title="Customers"
        description="Browse and manage customers."
        actions={
          <Can permission={resolvePermission('clients.create')}>
            <Link href="/clients/create" className={cn(buttonVariants())}>
              New customer
            </Link>
          </Can>
        }
      >
        <ClientsTable
          clients={clients}
          appliedFilters={appliedFilters}
          truncated={truncated}
          totalRecords={totalRecords}
          filterTrigger={
            <ListFilterTrigger
              activeCount={activeFilterCount}
              onClick={() => setFilterOpen(true)}
            />
          }
        />
      </ListPage>

      <ClientsFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        offices={offices}
        clients={clients}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </>
  );
}
