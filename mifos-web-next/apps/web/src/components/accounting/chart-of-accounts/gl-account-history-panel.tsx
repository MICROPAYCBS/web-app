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
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { Button } from '@/components/ui/button';
import {
  formatGlAccountEnquiryAccountHeading,
  formatGlAccountEnquiryPeriodLabel
} from '@/lib/accounting/gl-account-enquiry-display';
import type { GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import type { Department } from '@/lib/fineract/departments';
import {
  buildGlAccountHistoryUrl,
  countActiveGlAccountHistoryFilters,
  glAccountEnquiryFiltersFromQuery,
  glAccountEnquiryFiltersSignature,
  glAccountEnquiryHasRequiredFilters,
  type GlAccountEnquiryLine,
  type GlAccountEnquiryListQuery,
  type GlAccountEnquirySearchFilters
} from '@/lib/fineract/gl-account-enquiry-query';

export function GlAccountHistoryPanel({
  glAccountId,
  lines,
  query,
  summary,
  glAccount,
  loadError,
  returnTo = null,
  offices,
  departments,
  currencies
}: {
  glAccountId: number;
  lines: GlAccountEnquiryLine[];
  query: GlAccountEnquiryListQuery;
  summary: GlAccountEnquirySummary | null;
  glAccount: FineractGlAccountDetail | null;
  loadError?: string | null;
  returnTo?: string | null;
  offices: FineractOfficeOption[];
  departments: Department[];
  currencies: FineractCurrencyOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasSearch = glAccountEnquiryHasRequiredFilters({
    ...query,
    glAccountId: String(glAccountId)
  });
  const [filterOpen, setFilterOpen] = useState(!hasSearch);
  const filters = glAccountEnquiryFiltersFromQuery({
    ...query,
    glAccountId: String(glAccountId)
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const appliedFiltersSignature = useMemo(
    () => glAccountEnquiryFiltersSignature(filters),
    [filters]
  );
  const activeFilterCount = countActiveGlAccountHistoryFilters(filters);
  const currencyCode = query.currencyCode;
  const periodLabel = formatGlAccountEnquiryPeriodLabel(query.fromDate, query.toDate);
  const accountHeading = formatGlAccountEnquiryAccountHeading(glAccount);

  useEffect(() => {
    setDraftFilters(filters);
  }, [appliedFiltersSignature]);

  const navigate = useCallback(
    (next: GlAccountEnquirySearchFilters) => {
      startTransition(() => {
        router.push(
          buildGlAccountHistoryUrl(
            glAccountId,
            {
              officeId: next.officeId,
              currencyCode: next.currencyCode,
              departmentId: next.departmentId,
              fromDate: next.fromDate,
              toDate: next.toDate
            },
            { returnTo }
          )
        );
      });
    },
    [glAccountId, returnTo, router]
  );

  function handleApplyFilters(nextFilters: GlAccountEnquirySearchFilters) {
    if (!nextFilters.currencyCode?.trim() || !nextFilters.officeId?.trim()) {
      return;
    }
    navigate({ ...nextFilters, glAccountId: String(glAccountId) });
    setFilterOpen(false);
  }

  function handleClearFilters() {
    navigate({
      glAccountId: String(glAccountId),
      currencyCode: '',
      officeId: '',
      departmentId: '',
      fromDate: query.fromDate,
      toDate: query.toDate
    });
  }

  const { table, resetColumnVisibility } = useGlAccountEnquiryTable({ lines });

  return (
    <>
      {!hasSearch ? (
        <EmptyState
          icon={Search}
          title="Choose branch and currency to begin"
          description="Open filters, select a branch and currency, then search account history."
          action={
            <Button type="button" onClick={() => setFilterOpen(true)}>
              Open filters
            </Button>
          }
        />
      ) : loadError ? (
        <LoadErrorAlert title="Could not load account history" message={loadError} />
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

      <GlAccountEnquiryFilterSidebar
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        offices={offices}
        departments={departments}
        currencies={currencies}
        pending={pending}
        lockedGlAccountId={String(glAccountId)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </>
  );
}
