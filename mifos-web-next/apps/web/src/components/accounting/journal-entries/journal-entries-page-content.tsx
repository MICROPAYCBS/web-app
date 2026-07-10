'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractJournalEntriesPage,
  FineractJournalEntryGlAccountOption,
  FineractOfficeOption
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { JournalEntriesFilterSidebar } from '@/components/accounting/journal-entries/journal-entries-filter-sidebar';
import {
  JournalEntriesTableView,
  useJournalEntriesTable,
  type JournalEntrySortColumn
} from '@/components/accounting/journal-entries/journal-entries-table';
import { DataTableColumnVisibility } from '@/components/composites/data-table/data-table-column-visibility';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  buildJournalEntriesUrl,
  countActiveJournalEntryFilters,
  journalEntryFiltersFromQuery,
  journalEntryFiltersSignature,
  type JournalEntryListQuery,
  type JournalEntrySearchFilters
} from '@/lib/fineract/journal-entry-query';
import type { Department } from '@/lib/fineract/departments';
import { JOURNAL_ENTRIES_BULK_IMPORT_PATH } from '@/lib/fineract/bulk-import-paths';
import { cn } from '@/lib/utils';

export function JournalEntriesPageContent({
  page,
  query,
  offices,
  glAccounts,
  departments
}: {
  page: FineractJournalEntriesPage;
  query: JournalEntryListQuery;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const filters = journalEntryFiltersFromQuery(query);
  const [draftFilters, setDraftFilters] = useState(filters);
  const appliedFiltersSignature = useMemo(() => journalEntryFiltersSignature(filters), [filters]);
  const activeFilterCount = countActiveJournalEntryFilters(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [appliedFiltersSignature]);

  const navigate = useCallback(
    (next: JournalEntryListQuery) => {
      startTransition(() => {
        router.push(buildJournalEntriesUrl(next));
      });
    },
    [router]
  );

  function handleApplyFilters(nextFilters: JournalEntrySearchFilters) {
    navigate({
      ...query,
      ...nextFilters,
      offset: 0
    });
  }

  function handleClearFilters() {
    navigate({
      offset: 0,
      limit: query.limit,
      orderBy: '',
      sortOrder: '',
      dateFormat: query.dateFormat,
      locale: query.locale
    });
  }

  function handleSort(column: JournalEntrySortColumn) {
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
  const { table, resetColumnVisibility } = useJournalEntriesTable({
    page,
    pageSize: query.limit,
    pageIndex,
    orderBy: query.orderBy,
    sortOrder: query.sortOrder,
    onSort: handleSort,
    onPaginationChange: handlePaginationChange
  });

  return (
    <>
      <ListPage
        title="Journal entries"
        description="Search manual and system journal entries across branches and GL accounts."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Can permission="READ_JOURNALENTRY">
              <Link
                href={JOURNAL_ENTRIES_BULK_IMPORT_PATH}
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                <Upload className="mr-2 size-4" />
                Import
              </Link>
            </Can>
            <Can permission="CREATE_JOURNALENTRY">
              <Link href="/accounting/journal-entries/create" className={cn(buttonVariants())}>
                <Plus className="mr-2 size-4" />
                Create entry
              </Link>
            </Can>
          </div>
        }
      >
        <JournalEntriesTableView
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
      </ListPage>

      <JournalEntriesFilterSidebar
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        offices={offices}
        glAccounts={glAccounts}
        departments={departments}
        pending={pending}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </>
  );
}
