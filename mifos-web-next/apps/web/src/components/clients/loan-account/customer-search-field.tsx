'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef, useState } from 'react';
import { searchLoanGuarantorClientsAction } from '@/actions/loan-guarantor';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';

const SEARCH_DEBOUNCE_MS = 400;

export type CustomerSearchSelection = {
  id: number;
  label: string;
};

type CustomerHit = {
  id: number;
  displayName: string;
  accountNo?: string;
  officeName?: string;
};

function hitLabel(hit: CustomerHit) {
  const extra = [hit.accountNo, hit.officeName].filter(Boolean).join(' · ');
  return extra ? `${hit.displayName} (${extra})` : hit.displayName;
}

export function CustomerSearchField({
  id,
  selectedId,
  selectedLabel,
  onSelect,
  error,
  disabled,
  excludeClientId
}: {
  id: string;
  selectedId?: number;
  selectedLabel?: string;
  onSelect: (customer: CustomerSearchSelection | null) => void;
  error?: string;
  disabled?: boolean;
  excludeClientId?: number;
}) {
  const [query, setQuery] = useState(selectedLabel ?? '');
  const [hits, setHits] = useState<CustomerHit[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const skipLabelSync = useRef(false);

  useEffect(() => {
    if (skipLabelSync.current) {
      skipLabelSync.current = false;
      return;
    }
    setQuery(selectedLabel ?? '');
  }, [selectedId, selectedLabel]);

  useEffect(() => {
    const trimmed = query.trim();
    if (disabled || trimmed.length < 2 || (selectedId != null && query === (selectedLabel ?? ''))) {
      setHits([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchLoanGuarantorClientsAction(trimmed).then((result) => {
        if (cancelled) {
          return;
        }
        setSearching(false);
        if (!result.ok) {
          setSearchError(result.message);
          setHits([]);
          return;
        }
        setSearchError(null);
        setHits(
          result.clients.filter(
            (client) => excludeClientId == null || client.id !== excludeClientId
          )
        );
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [disabled, excludeClientId, query, selectedId, selectedLabel]);

  function handleQueryChange(next: string) {
    setQuery(next);
    if (selectedId != null) {
      skipLabelSync.current = true;
      onSelect(null);
    }
  }

  return (
    <div className="space-y-2">
      <TextField
        id={id}
        label="Customer"
        required
        value={query}
        onChange={handleQueryChange}
        placeholder="Search by name or account number"
        error={error ?? searchError ?? undefined}
        disabled={disabled}
        autoComplete="off"
      />
      {searching ? <p className="text-sm text-muted-foreground">Searching…</p> : null}
      {hits.length > 0 ? (
        <ul className="max-h-48 overflow-auto rounded-md border border-border">
          {hits.map((hit) => (
            <li key={hit.id}>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start rounded-none px-3 py-2 text-left"
                onClick={() => {
                  const label = hitLabel(hit);
                  setQuery(label);
                  setHits([]);
                  onSelect({ id: hit.id, label });
                }}
              >
                <span className="flex flex-col">
                  <span>{hit.displayName}</span>
                  {hit.accountNo || hit.officeName ? (
                    <span className="text-xs text-muted-foreground">
                      {[hit.accountNo, hit.officeName].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
