'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeListItem, ChargeTemplate } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { ChargesFilterSheet } from '@/components/products/charges/charges-filter-sheet';
import { ChargesTable } from '@/components/products/charges/charges-table';
import { buttonVariants } from '@/components/ui/button';
import { chargeCreatePath } from '@/lib/fineract/charge-paths';
import {
  countActiveChargeListFilters,
  type ChargeListFilters
} from '@/lib/fineract/charge-list-query';
import { cn } from '@/lib/utils';

function filtersSignature(filters: ChargeListFilters): string {
  return filters.appliesTo ?? '';
}

export function ChargesPageContent({
  charges,
  appliesToOptions
}: {
  charges: ChargeListItem[];
  appliesToOptions: ChargeTemplate['chargeAppliesToOptions'];
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ChargeListFilters>({});
  const [draftFilters, setDraftFilters] = useState<ChargeListFilters>({});

  const appliedFiltersSignature = useMemo(
    () => filtersSignature(appliedFilters),
    [appliedFilters]
  );
  const activeFilterCount = countActiveChargeListFilters(appliedFilters);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFiltersSignature, appliedFilters]);

  function handleApplyFilters(nextFilters: ChargeListFilters) {
    setAppliedFilters(nextFilters);
  }

  function handleClearFilters() {
    setAppliedFilters({});
  }

  return (
    <>
      <ListPage
        title="Charges"
        description="Fees and penalties applied to loans, savings, deposits, shares, and customers."
        actions={
          <Can permission="CREATE_CHARGE">
            <Link href={chargeCreatePath()} className={cn(buttonVariants())}>
              Create charge
            </Link>
          </Can>
        }
      >
        <ChargesTable
          charges={charges}
          appliedFilters={appliedFilters}
          filterTrigger={
            <ListFilterTrigger
              activeCount={activeFilterCount}
              onClick={() => setFilterOpen(true)}
            />
          }
        />
      </ListPage>

      <ChargesFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        appliesToOptions={appliesToOptions}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </>
  );
}
