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
import type { PlatformNavStructure } from './navigation-types';

interface NavigationContextValue {
  nav: PlatformNavStructure;
  quickFindOpen: boolean;
  openQuickFind: () => void;
  closeQuickFind: () => void;
  toggleQuickFind: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  nav,
  children
}: {
  nav: PlatformNavStructure;
  children: ReactNode;
}) {
  const [quickFindOpen, setQuickFindOpen] = useState(false);

  const openQuickFind = useCallback(() => setQuickFindOpen(true), []);
  const closeQuickFind = useCallback(() => setQuickFindOpen(false), []);
  const toggleQuickFind = useCallback(() => setQuickFindOpen((v) => !v), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQuickFindOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo(
    () => ({
      nav,
      quickFindOpen,
      openQuickFind,
      closeQuickFind,
      toggleQuickFind
    }),
    [nav, quickFindOpen, openQuickFind, closeQuickFind, toggleQuickFind]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return ctx;
}
