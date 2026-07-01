'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAuditTrailSearchTemplate,
  FineractAuditTrailsPage
} from '@mifos/api-client';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { toastFineractError } from '@/lib/toast-fineract-error';
import { exportAuditTrailsCsvAction } from '@/actions/audit-trails';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { AuditTrailsFilterSheet } from '@/components/system/audit-trails-filter-sheet';
import {
  AuditTrailsTable,
  type AuditTrailSortColumn
} from '@/components/system/audit-trails-table';
import { Button } from '@/components/ui/button';
import {
  auditTrailFiltersFromQuery,
  countActiveAuditTrailFilters,
  type AuditTrailListQuery,
  type AuditTrailSearchFilters
} from '@/lib/fineract/audit-trail-query';

function buildAuditTrailUrl(query: AuditTrailListQuery): string {
  const params = new URLSearchParams();
  const page = Math.floor(query.offset / query.limit);
  if (page > 0) {
    params.set('page', String(page));
  }
  if (query.limit !== 25) {
    params.set('limit', String(query.limit));
  }
  if (query.orderBy) {
    params.set('orderBy', query.orderBy);
  }
  if (query.sortOrder) {
    params.set('sortOrder', query.sortOrder);
  }

  const filters = auditTrailFiltersFromQuery(query);
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'dateFormat' || key === 'locale' || key === 'includeJson') {
      continue;
    }
    if (typeof value === 'string' && value) {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  return qs ? `/system/audit-trails?${qs}` : '/system/audit-trails';
}

export function AuditTrailsPageContent({
  page,
  query,
  template
}: {
  page: FineractAuditTrailsPage;
  query: AuditTrailListQuery;
  template: FineractAuditTrailSearchTemplate;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const filters = auditTrailFiltersFromQuery(query);
  const activeFilterCount = countActiveAuditTrailFilters(filters);

  const navigate = useCallback(
    (next: AuditTrailListQuery) => {
      startTransition(() => {
        router.push(buildAuditTrailUrl(next));
      });
    },
    [router]
  );

  function handleApplyFilters(nextFilters: AuditTrailSearchFilters) {
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

  function handleSort(column: AuditTrailSortColumn) {
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

  function handleExportCsv() {
    startTransition(async () => {
      const result = await exportAuditTrailsCsvAction(query);
      if (!result.ok) {
        toastFineractError(result.message);
        return;
      }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Audit trails exported.');
    });
  }

  const pageIndex = Math.floor(query.offset / query.limit);

  return (
    <>
      <ListPage
        title="Audit trails"
        description="Search and review platform activity, including maker-checker events."
        actions={
          <Button type="button" onClick={handleExportCsv} disabled={pending}>
            <Download className="mr-2 size-4" />
            Download CSV
          </Button>
        }
      >
        <AuditTrailsTable
          page={page}
          pageSize={query.limit}
          pageIndex={pageIndex}
          orderBy={query.orderBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          onPaginationChange={handlePaginationChange}
          pending={pending}
          toolbar={
            <ListFilterTrigger
              activeCount={activeFilterCount}
              onClick={() => setFilterOpen(true)}
              disabled={pending}
            />
          }
        />
      </ListPage>

      <AuditTrailsFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        template={template}
        filters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        disabled={pending}
        pending={pending}
      />
    </>
  );
}
