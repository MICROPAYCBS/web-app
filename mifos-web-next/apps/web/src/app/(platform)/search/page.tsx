/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { SearchPageContent } from '@/components/search/search-page-content';
import { searchEntities } from '@/lib/fineract/search';
import {
  SEARCH_RESOURCE_ALL,
  SEARCH_RESOURCE_OPTIONS,
  SEARCH_RESULTS_MAX,
  SEARCH_MIN_CHARS
} from '@/lib/search/entity-search';
import { getServerSession } from '@/lib/session/server';

function resourceLabelFor(value: string): string {
  return SEARCH_RESOURCE_OPTIONS.find((option) => option.value === value)?.label ?? 'All';
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ query?: string; resource?: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const query = params.query?.trim() ?? '';
  const resource = params.resource ?? SEARCH_RESOURCE_ALL;

  if (!query || query.length < SEARCH_MIN_CHARS) {
    return (
      <SearchPageContent
        query={query}
        resourceLabel={resourceLabelFor(resource)}
        results={[]}
        overload={false}
        hint={
          query.length > 0 && query.length < SEARCH_MIN_CHARS
            ? 'Enter at least 2 characters to search.'
            : undefined
        }
      />
    );
  }

  const results = await searchEntities({ query, resource });
  const overload = results.length > SEARCH_RESULTS_MAX;
  const pageResults = overload ? results.slice(0, SEARCH_RESULTS_MAX) : results;

  return (
    <SearchPageContent
      query={query}
      resourceLabel={resourceLabelFor(resource)}
      results={pageResults}
      overload={overload}
    />
  );
}
