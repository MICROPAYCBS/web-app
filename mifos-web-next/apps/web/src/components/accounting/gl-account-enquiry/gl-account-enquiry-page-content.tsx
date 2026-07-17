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
  FineractGlAccountDetail,
  FineractJournalEntryGlAccountOption,
  FineractOfficeOption
} from '@mifos/api-client';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { GlAccountEnquiryFilterSidebar } from '@/components/accounting/gl-account-enquiry/gl-account-enquiry-filter-sidebar';
import { GlAccountEnquirySummaryPanel } from '@/components/accounting/gl-account-enquiry/gl-account-enquiry-summary-panel';
import {
  GlAccountEnquiryTableView,
  useGlAccountEnquiryTable
} from '@/components/accounting/gl-account-enquiry/gl-account-enquiry-table';
import { DataTableColumnVisibility } from '@/components/composites/data-table/data-table-column-visibility';
import { EmptyState } from '@/components/composites/empty-state';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { Button } from '@/components/ui/button';
import {
  formatGlAccountEnquiryAccountHeading,
  formatGlAccountEnquiryPeriodLabel
} from '@/lib/accounting/gl-account-enquiry-display';
import type { GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import {
  buildGlAccountEnquiryUrl,
  countActiveGlAccountEnquiryFilters,
  glAccountEnquiryFiltersFromQuery,
  glAccountEnquiryFiltersSignature,
  glAccountEnquiryHasRequiredFilters,
  type GlAccountEnquiryLine,
  type GlAccountEnquiryListQuery,
  type GlAccountEnquirySearchFilters
} from '@/lib/fineract/gl-account-enquiry-query';
import type { Department } from '@/lib/fineract/departments';

export function GlAccountEnquiryPageContent({
  lines,
  query,
  summary,
  glAccount,
  offices,
  glAccounts,
  departments,
  currencies,
  defaultCurrencyCode,
  defaultOfficeId
}: {
  lines: GlAccountEnquiryLine[];
  query: GlAccountEnquiryListQuery;
  summary: GlAccountEnquirySummary | null;
  glAccount: FineractGlAccountDetail | null;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  currencies: FineractCurrencyOption[];
  defaultCurrencyCode: string;
  defaultOfficeId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasSearch = glAccountEnquiryHasRequiredFilters(query);
  const [filterOpen, setFilterOpen] = useState(!hasSearch);
  const filters = glAccountEnquiryFiltersFromQuery(query);
  const [draftFilters, setDraftFilters] = useState(filters);
  const appliedFiltersSignature = useMemo(
    () => glAccountEnquiryFiltersSignature(filters),
    [filters]
  );
  const activeFilterCount = countActiveGlAccountEnquiryFilters(filters);
  const currencyCode = query.currencyCode || defaultCurrencyCode;
  const periodLabel = formatGlAccountEnquiryPeriodLabel(query.fromDate, query.toDate);
  const accountHeading = formatGlAccountEnquiryAccountHeading(glAccount);

  useEffect(() => {
    setDraftFilters(filters);
  }, [appliedFiltersSignature]);

  const navigate = useCallback(
    (next: GlAccountEnquiryListQuery) => {
      startTransition(() => {
        router.push(buildGlAccountEnquiryUrl(next));
      });
    },
    [router]
  );

  function handleApplyFilters(nextFilters: GlAccountEnquirySearchFilters) {
    if (
      !nextFilters.glAccountId?.trim() ||
      !nextFilters.currencyCode?.trim() ||
      !nextFilters.officeId?.trim()
    ) {
      return;
    }
    navigate(nextFilters);
    setFilterOpen(false);
  }

  function handleClearFilters() {
    navigate({
      glAccountId: '',
      currencyCode: defaultCurrencyCode,
      officeId: defaultOfficeId,
      departmentId: '',
      fromDate: query.fromDate,
      toDate: query.toDate
    });
  }

  const { table, resetColumnVisibility } = useGlAccountEnquiryTable({ lines });

  return (
    <>
      <ListPage
        title="GL account enquiry"
        description="Search journal activity for a single GL account with opening and closing balances."
      >
        {!hasSearch ? (
          <EmptyState
            icon={Search}
            title="Select an account, branch, and currency to begin"
            description="Open search filters, choose the GL account, branch, and currency, then run the enquiry."
            action={
              <Button type="button" onClick={() => setFilterOpen(true)}>
                Open search
              </Button>
            }
          />
        ) : (
          <div className="space-y-4" aria-busy={pending || undefined}>
            <GlAccountEnquirySummaryPanel
              summary={summary}
              currencyCode={currencyCode}
              glAccountTypeId={glAccount?.type?.id}
              periodLabel={periodLabel}
              accountHeading={accountHeading}
              pending={pending}
            />
            <GlAccountEnquiryTableView
              table={table}
              pending={pending}
              toolbar={
                <>
                  <ListFilterTrigger
                    activeCount={activeFilterCount}
                    onClick={() => setFilterOpen(true)}
                    disabled={pending}
                  />
                  <DataTableColumnVisibility
                    table={table}
                    disabled={pending}
                    onReset={resetColumnVisibility}
                  />
                </>
              }
            />
          </div>
        )}
      </ListPage>

      <GlAccountEnquiryFilterSidebar
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        offices={offices}
        glAccounts={glAccounts}
        departments={departments}
        currencies={currencies}
        pending={pending}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </>
  );
}
