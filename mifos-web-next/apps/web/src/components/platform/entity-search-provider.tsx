'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { EntitySearchDialog } from '@/components/platform/entity-search-dialog';

interface EntitySearchContextValue {
  openEntitySearch: () => void;
  closeEntitySearch: () => void;
  toggleEntitySearch: () => void;
}

const EntitySearchContext = createContext<EntitySearchContextValue | null>(null);

export function EntitySearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openEntitySearch = useCallback(() => setOpen(true), []);
  const closeEntitySearch = useCallback(() => setOpen(false), []);
  const toggleEntitySearch = useCallback(() => setOpen((current) => !current), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const inField =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openEntitySearch();
        return;
      }

      if (!inField && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === '/') {
        event.preventDefault();
        openEntitySearch();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openEntitySearch]);

  const value = useMemo(
    () => ({ openEntitySearch, closeEntitySearch, toggleEntitySearch }),
    [openEntitySearch, closeEntitySearch, toggleEntitySearch]
  );

  return (
    <EntitySearchContext.Provider value={value}>
      {children}
      <EntitySearchDialog open={open} onOpenChange={setOpen} />
    </EntitySearchContext.Provider>
  );
}

export function useEntitySearch() {
  const ctx = useContext(EntitySearchContext);
  if (!ctx) {
    throw new Error('useEntitySearch must be used within EntitySearchProvider');
  }
  return ctx;
}
