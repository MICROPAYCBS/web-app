'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSearchResult } from '@mifos/api-client';
import { SearchResultsTable } from '@/components/search/search-results-table';
import { ListPage } from '@/components/composites/list-page';

export function SearchPageContent({
  query,
  resourceLabel,
  results,
  overload,
  hint
}: {
  query: string;
  resourceLabel: string;
  results: FineractSearchResult[];
  overload: boolean;
  hint?: string;
}) {
  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <ListPage
      title="Search"
      description={
        hasQuery
          ? `Results for “${query}” in ${resourceLabel.toLowerCase()}.`
          : 'Enter a search term from the header to find customers, accounts, and groups.'
      }
    >
      {hint ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {!hasQuery && !hint ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Use the search bar in the header to look up records.
        </p>
      ) : null}

      {hasQuery && overload ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Your search returned more than 200 records. Only the first 200 are shown.
        </p>
      ) : null}

      {hasQuery && !hasResults && !hint ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No data found.
        </p>
      ) : null}

      {hasQuery && hasResults && !hint ? <SearchResultsTable results={results} /> : null}
    </ListPage>
  );
}
