'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCurrencyOption,
  FineractGlAccountEnquiryRow,
  FineractOfficeOption
} from '@mifos/api-client';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { AdvancedGlAccountEnquiryFilterSidebar } from '@/components/accounting/advanced-gl-account-enquiry/advanced-gl-account-enquiry-filter-sidebar';
import { AdvancedGlAccountEnquiryTable } from '@/components/accounting/advanced-gl-account-enquiry/advanced-gl-account-enquiry-table';
import { EmptyState } from '@/components/composites/empty-state';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { Button } from '@/components/ui/button';
import {
  EMPTY_ADVANCED_GL_ACCOUNT_ENQUIRY_FILTERS,
  advancedGlAccountEnquiryFiltersFromQuery,
  advancedGlAccountEnquiryFiltersSignature,
  advancedGlAccountEnquiryHasActiveFilters,
  buildAdvancedGlAccountEnquiryUrl,
  countActiveAdvancedGlAccountEnquiryFilters,
  type AdvancedGlAccountEnquiryListQuery,
  type AdvancedGlAccountEnquirySearchFilters
} from '@/lib/fineract/advanced-gl-account-enquiry-query';

export function AdvancedGlAccountEnquiryPageContent({
  query,
  rows,
  loadError,
  offices,
  currencies
}: {
  query: AdvancedGlAccountEnquiryListQuery;
  rows: FineractGlAccountEnquiryRow[];
  loadError?: string | null;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasSearch = advancedGlAccountEnquiryHasActiveFilters(query);
  const [filterOpen, setFilterOpen] = useState(!hasSearch);
  const filters = advancedGlAccountEnquiryFiltersFromQuery(query);
  const [draftFilters, setDraftFilters] = useState(filters);
  const appliedFiltersSignature = useMemo(
    () => advancedGlAccountEnquiryFiltersSignature(filters),
    [filters]
  );
  const activeFilterCount = countActiveAdvancedGlAccountEnquiryFilters(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [appliedFiltersSignature]);

  const navigate = useCallback(
    (next: AdvancedGlAccountEnquiryListQuery) => {
      startTransition(() => {
        router.push(buildAdvancedGlAccountEnquiryUrl(next));
      });
    },
    [router]
  );

  function handleApplyFilters(nextFilters: AdvancedGlAccountEnquirySearchFilters) {
    if (countActiveAdvancedGlAccountEnquiryFilters(nextFilters) === 0) {
      return;
    }
    navigate(nextFilters);
    setFilterOpen(false);
  }

  function handleClearFilters() {
    navigate(EMPTY_ADVANCED_GL_ACCOUNT_ENQUIRY_FILTERS);
  }

  return (
    <>
      <ListPage
        title="GL account enquiry"
        description="Search GL accounts by prefix, ledger number, branch, currency, and status."
        actions={
          hasSearch ? (
            <ListFilterTrigger
              activeCount={activeFilterCount}
              onClick={() => setFilterOpen(true)}
              disabled={pending}
            />
          ) : null
        }
      >
        {!hasSearch ? (
          <EmptyState
            icon={Search}
            title="Specify at least one filter to begin"
            description="Open search and enter a GL prefix, ledger number, branch, currency, or status."
            action={
              <Button type="button" onClick={() => setFilterOpen(true)}>
                Open search
              </Button>
            }
          />
        ) : loadError ? (
          <LoadErrorAlert title="Could not load enquiry results" message={loadError} />
        ) : (
          <AdvancedGlAccountEnquiryTable
            rows={rows}
            pending={pending}
            returnTo={buildAdvancedGlAccountEnquiryUrl(filters)}
          />
        )}
      </ListPage>

      <AdvancedGlAccountEnquiryFilterSidebar
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        offices={offices}
        currencies={currencies}
        pending={pending}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </>
  );
}
