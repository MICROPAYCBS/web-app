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
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from 'react';
import { usePathname } from 'next/navigation';
import type { PlatformNavGroup, PlatformNavStructure } from './navigation-types';
import { findNavGroupForPath } from './navigation-utils';

interface NavigationUiState {
  pathname: string;
  manualGroupId: string | null;
  pinnedToRoot: boolean;
  findQuery: string;
}

interface NavigationContextValue {
  nav: PlatformNavStructure;
  findQuery: string;
  setFindQuery: (query: string) => void;
  findInputRef: RefObject<HTMLInputElement | null>;
  focusNavFind: () => void;
  activeGroupId: string | null;
  activeGroup: PlatformNavGroup | null;
  enterGroup: (groupId: string) => void;
  exitGroup: () => void;
  openQuickFind: () => void;
  quickFindOpen: boolean;
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
  const pathname = usePathname();
  const findInputRef = useRef<HTMLInputElement>(null);

  const routeGroupId = useMemo(
    () => findNavGroupForPath(nav, pathname)?.id ?? null,
    [nav, pathname]
  );

  const [navUi, setNavUi] = useState<NavigationUiState>(() => ({
    pathname,
    manualGroupId: null,
    pinnedToRoot: false,
    findQuery: ''
  }));

  if (navUi.pathname !== pathname) {
    setNavUi({
      pathname,
      manualGroupId: null,
      pinnedToRoot: false,
      findQuery: ''
    });
  }

  const displayedGroupId = navUi.pinnedToRoot
    ? null
    : (navUi.manualGroupId ?? routeGroupId);

  const activeGroup = useMemo(
    () => nav.groups.find((g) => g.id === displayedGroupId) ?? null,
    [nav.groups, displayedGroupId]
  );

  const setFindQuery = useCallback((query: string) => {
    setNavUi((current) => ({ ...current, findQuery: query }));
  }, []);

  const focusNavFind = useCallback(() => {
    findInputRef.current?.focus();
    findInputRef.current?.select();
  }, []);

  const enterGroup = useCallback((groupId: string) => {
    setNavUi((current) => ({
      ...current,
      manualGroupId: groupId,
      pinnedToRoot: false,
      findQuery: ''
    }));
  }, []);

  const exitGroup = useCallback(() => {
    setNavUi((current) => ({
      ...current,
      manualGroupId: null,
      pinnedToRoot: true,
      findQuery: ''
    }));
  }, []);

  const openQuickFind = focusNavFind;
  const closeQuickFind = useCallback(() => {
    findInputRef.current?.blur();
    setFindQuery('');
  }, [setFindQuery]);
  const toggleQuickFind = useCallback(() => {
    if (document.activeElement === findInputRef.current) {
      closeQuickFind();
    } else {
      focusNavFind();
    }
  }, [closeQuickFind, focusNavFind]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const inField =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusNavFind();
        return;
      }

      if (!inField && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === 'f') {
        event.preventDefault();
        focusNavFind();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusNavFind]);

  const value = useMemo(
    () => ({
      nav,
      findQuery: navUi.findQuery,
      setFindQuery,
      findInputRef,
      focusNavFind,
      activeGroupId: displayedGroupId,
      activeGroup,
      enterGroup,
      exitGroup,
      openQuickFind,
      quickFindOpen: false,
      closeQuickFind,
      toggleQuickFind
    }),
    [
      nav,
      navUi.findQuery,
      setFindQuery,
      focusNavFind,
      displayedGroupId,
      activeGroup,
      enterGroup,
      exitGroup,
      openQuickFind,
      closeQuickFind,
      toggleQuickFind
    ]
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
