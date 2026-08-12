'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserListItem, FineractUserSessionsPage } from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { LoginHistoryFilterSheet } from '@/components/app-users/login-history-filter-sheet';
import { UserSessionsTable } from '@/components/app-users/user-sessions-table';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import {
  countActiveUserSessionHistoryFilters,
  USER_SESSION_HISTORY_DEFAULT_LIMIT,
  type UserSessionHistoryQuery
} from '@/lib/fineract/user-session-query';

function buildLoginHistoryUrl(query: UserSessionHistoryQuery): string {
  const params = new URLSearchParams();
  const page = Math.floor(query.offset / query.limit);
  if (page > 0) {
    params.set('page', String(page));
  }
  if (query.limit !== USER_SESSION_HISTORY_DEFAULT_LIMIT) {
    params.set('limit', String(query.limit));
  }
  if (query.userId != null) {
    params.set('userId', String(query.userId));
  }
  if (query.fromDate) {
    params.set('fromDate', query.fromDate);
  }
  if (query.toDate) {
    params.set('toDate', query.toDate);
  }
  const qs = params.toString();
  return qs ? `/appusers/login-history?${qs}` : '/appusers/login-history';
}

export function LoginHistoryPageContent({
  page,
  query,
  users
}: {
  page: FineractUserSessionsPage;
  query: UserSessionHistoryQuery;
  users: FineractUserListItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = countActiveUserSessionHistoryFilters(query);
  const pageIndex = Math.floor(query.offset / query.limit);

  const navigate = useCallback(
    (next: UserSessionHistoryQuery) => {
      startTransition(() => {
        router.push(buildLoginHistoryUrl(next));
      });
    },
    [router]
  );

  return (
    <ListPage
      title="Login history"
      description="Each row is a successful sign-in. Failed attempts and users who skip two-factor verification are not included."
      toolbar={
        <div className="flex justify-end">
          <ListFilterTrigger
            activeCount={activeFilterCount}
            onClick={() => setFilterOpen(true)}
            disabled={pending}
          />
        </div>
      }
    >
      <UserSessionsTable
        sessions={page.pageItems}
        showUsername
        stickyHeader
        pending={pending}
        emptyMessage="No sign-ins match these filters."
        emptyDescription="Try a different user or date range."
        pageIndex={pageIndex}
        pageSize={query.limit}
        totalRecords={page.totalFilteredRecords}
        onPaginationChange={(pagination) => {
          navigate({
            ...query,
            offset: pagination.pageIndex * pagination.pageSize,
            limit: pagination.pageSize
          });
        }}
      />
      <LoginHistoryFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        users={users}
        query={query}
        pending={pending}
        onApply={(filters) => {
          navigate({
            ...query,
            ...filters,
            offset: 0
          });
        }}
        onClear={() => {
          navigate({
            offset: 0,
            limit: query.limit
          });
        }}
      />
    </ListPage>
  );
}
