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
  FineractJournalEntriesPage,
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
  useGlAccountEnquiryTable,
  type GlAccountEnquirySortColumn
} from '@/components/accounting/gl-account-enquiry/gl-account-enquiry-table';
import { DataTableColumnVisibility } from '@/components/composites/data-table/data-table-column-visibility';
import { EmptyState } from '@/components/composites/empty-state';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { Button } from '@/components/ui/button';
import { formatGlAccountEnquiryAccountHeading, formatGlAccountEnquiryPeriodLabel } from '@/lib/accounting/gl-account-enquiry-display';
import type { GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import type { Department } from '@/lib/fineract/departments';
import {
  buildGlAccountEnquiryUrl,
  countActiveGlAccountEnquiryFilters,
  GL_ACCOUNT_ENQUIRY_DEFAULT_ORDER_BY,
  GL_ACCOUNT_ENQUIRY_DEFAULT_SORT_ORDER,
  glAccountEnquiryFiltersFromQuery,
  glAccountEnquiryFiltersSignature,
  glAccountEnquiryHasRequiredFilters,
  type GlAccountEnquiryListQuery,
  type GlAccountEnquirySearchFilters
} from '@/lib/fineract/gl-account-enquiry-query';

export function GlAccountEnquiryPageContent({
  page,
  query,
  summary,
  glAccount,
  offices,
  glAccounts,
  departments,
  currencies,
  defaultCurrencyCode
}: {
  page: FineractJournalEntriesPage;
  query: GlAccountEnquiryListQuery;
  summary: GlAccountEnquirySummary | null;
  glAccount: FineractGlAccountDetail | null;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  currencies: FineractCurrencyOption[];
  defaultCurrencyCode: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasSearch = glAccountEnquiryHasRequiredFilters(query);
  const [filterOpen, setFilterOpen] = useState(!hasSearch);
  const filters = glAccountEnquiryFiltersFromQuery(query);
  const [draftFilters, setDraftFilters] = useState(filters);
  const appliedFiltersSignature = useMemo(() => glAccountEnquiryFiltersSignature(filters), [filters]);
  const activeFilterCount = countActiveGlAccountEnquiryFilters(filters);
  const balanceScope = query.officeId ? 'office' : 'organization';
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
    if (!nextFilters.glAccountId?.trim() || !nextFilters.currencyCode?.trim()) {
      return;
    }
    navigate({
      ...query,
      ...nextFilters,
      offset: 0
    });
    setFilterOpen(false);
  }

  function handleClearFilters() {
    navigate({
      offset: 0,
      limit: query.limit,
      orderBy: GL_ACCOUNT_ENQUIRY_DEFAULT_ORDER_BY,
      sortOrder: GL_ACCOUNT_ENQUIRY_DEFAULT_SORT_ORDER,
      glAccountId: '',
      currencyCode: defaultCurrencyCode,
      dateFormat: query.dateFormat,
      locale: query.locale
    });
  }

  function handleSort(column: GlAccountEnquirySortColumn) {
    const isActive = query.orderBy === column;
    const nextOrder = isActive && query.sortOrder === 'asc' ? 'desc' : 'asc';
    navigate({
      ...query,
      orderBy: column,
      sortOrder: nextOrder,
      offset: 0
    });
  }

  function handlePaginationChange(pagination: { pageIndex: number; pageSize: number }) {
    navigate({
      ...query,
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize
    });
  }

  const pageIndex = Math.floor(query.offset / query.limit);
  const { table, resetColumnVisibility } = useGlAccountEnquiryTable({
    page,
    pageSize: query.limit,
    pageIndex,
    orderBy: query.orderBy,
    sortOrder: query.sortOrder,
    balanceScope,
    onSort: handleSort,
    onPaginationChange: handlePaginationChange
  });

  return (
    <>
      <ListPage
        title="GL account enquiry"
        description="Search journal activity for a single GL account with opening and closing balances."
      >
        {!hasSearch ? (
          <EmptyState
            icon={Search}
            title="Select a GL account and currency to begin"
            description="Open search filters, choose the account and currency you want to review, then run the enquiry."
            action={
              <Button type="button" onClick={() => setFilterOpen(true)}>
                Open search
              </Button>
            }
          />
        ) : (
          <>
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
                page={page}
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
          </>
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
