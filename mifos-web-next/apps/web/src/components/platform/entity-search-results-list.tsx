'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSearchResult } from '@mifos/api-client';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  formatSearchEntityType,
  formatSearchResultLabel,
  formatSearchResultMetaParts,
  SEARCH_RESOURCE_ALL,
  searchResultTarget
} from '@/lib/search/entity-search';

export function EntitySearchResultsList({
  results,
  showEntityType,
  loading,
  queryTooShort,
  onNavigate
}: {
  results: FineractSearchResult[];
  showEntityType: boolean;
  loading: boolean;
  queryTooShort: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {queryTooShort ? (
        <StatusMessage>Type at least 2 characters to search.</StatusMessage>
      ) : loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 px-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Searching…
        </div>
      ) : results.length === 0 ? (
        <StatusMessage>No results found.</StatusMessage>
      ) : (
        <ul
          className="min-h-0 flex-1 overflow-y-auto py-1"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((entity, index) => (
            <EntitySearchResultRow
              key={`${entity.entityType}-${entity.entityId}-${entity.entityAccountNo ?? ''}-${index}`}
              entity={entity}
              showEntityType={showEntityType}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-3">
      <p className="text-center text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function EntitySearchResultRow({
  entity,
  showEntityType,
  onNavigate
}: {
  entity: FineractSearchResult;
  showEntityType: boolean;
  onNavigate: () => void;
}) {
  const target = searchResultTarget(entity);
  const label = formatSearchResultLabel(entity);
  const metaParts = formatSearchResultMetaParts(entity);
  const isLive = target.status === 'live' && target.href != null;

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {showEntityType ? (
            <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
              {formatSearchEntityType(entity.entityType)}
            </Badge>
          ) : null}
          <span className="truncate font-medium">{label}</span>
        </div>
        {metaParts.length ? (
          <p className="truncate text-xs text-muted-foreground">{metaParts.join(' · ')}</p>
        ) : (
          <p className="text-xs text-transparent" aria-hidden>
            —
          </p>
        )}
      </div>
      {isLive ? null : (
        <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
          Soon
        </Badge>
      )}
    </>
  );

  if (isLive) {
    return (
      <li role="option">
        <Link
          href={target.href!}
          onClick={onNavigate}
          className={cn(
            'flex min-h-14 items-center gap-2 px-3 py-2 text-sm transition-colors',
            'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none'
          )}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li
      role="option"
      aria-disabled="true"
      className="flex min-h-14 cursor-not-allowed items-center gap-2 px-3 py-2 text-sm opacity-70"
    >
      {content}
    </li>
  );
}

export function entitySearchShowsType(resource: string): boolean {
  return resource === SEARCH_RESOURCE_ALL;
}
