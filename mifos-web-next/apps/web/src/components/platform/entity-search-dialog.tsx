'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSearchResult } from '@mifos/api-client';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  EntitySearchResultsList,
  entitySearchShowsType
} from '@/components/platform/entity-search-results-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  buildSearchPageUrl,
  SEARCH_DEBOUNCE_MS,
  SEARCH_DIALOG_RESULTS_HEIGHT,
  SEARCH_INLINE_MAX,
  SEARCH_MIN_CHARS,
  SEARCH_RESOURCE_ALL,
  SEARCH_RESOURCE_OPTIONS,
  type SearchResourceValue
} from '@/lib/search/entity-search';

export function EntitySearchDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [resource, setResource] = useState<SearchResourceValue>(SEARCH_RESOURCE_ALL);
  const [results, setResults] = useState<FineractSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const queryTooShort = trimmedQuery.length < SEARCH_MIN_CHARS;
  const showEntityType = entitySearchShowsType(resource);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResource(SEARCH_RESOURCE_ALL);
      setResults([]);
      setTotalCount(0);
      setError(null);
      setLoading(false);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
    abortRef.current?.abort();
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    if (queryTooShort) {
      abortRef.current?.abort();
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({ query: trimmedQuery, resource });
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? 'Search failed.');
        }
        const data = (await response.json()) as FineractSearchResult[];
        if (controller.signal.aborted) {
          return;
        }
        setTotalCount(data.length);
        setResults(data.slice(0, SEARCH_INLINE_MAX));
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setResults([]);
        setTotalCount(0);
        setError(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, trimmedQuery, resource, queryTooShort]);

  function closeDialog() {
    onOpenChange(false);
  }

  const viewAllHref =
    !queryTooShort && totalCount > 0
      ? buildSearchPageUrl(trimmedQuery, resource)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search customers, loans, savings, and other records.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b px-3 py-3">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customers, accounts, groups…"
            className="h-10 border-0 bg-transparent px-1.5 shadow-none focus-visible:ring-0"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search query"
            aria-controls="entity-search-results"
            aria-expanded={!queryTooShort && (loading || results.length > 0)}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-b px-3 py-3">
          {SEARCH_RESOURCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setResource(option.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                resource === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          id="entity-search-results"
          className="shrink-0 overflow-hidden"
          style={{ height: SEARCH_DIALOG_RESULTS_HEIGHT }}
        >
          {error ? (
            <div className="flex h-full items-center justify-center px-3">
              <p className="text-center text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <EntitySearchResultsList
              results={results}
              showEntityType={showEntityType}
              loading={loading}
              queryTooShort={queryTooShort}
              onNavigate={closeDialog}
            />
          )}
        </div>

        {viewAllHref && totalCount > SEARCH_INLINE_MAX ? (
          <div className="border-t px-3 py-2">
            <Link
              href={viewAllHref}
              onClick={closeDialog}
              className="block text-center text-sm text-primary hover:underline"
            >
              View all {totalCount} results
            </Link>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
