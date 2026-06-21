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
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { ContextHelpContent } from '@/lib/context-help/types';

interface ContextHelpContextValue {
  content: ContextHelpContent;
  open: boolean;
  activeSectionId: string | null;
  setOpen: (open: boolean) => void;
  openSection: (sectionId: string) => void;
  focusSection: (sectionId: string) => void;
  toggle: () => void;
}

const ContextHelpContext = createContext<ContextHelpContextValue | null>(null);

export function ContextHelpProvider({
  content,
  children
}: {
  content: ContextHelpContent;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const openSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    setOpen(true);
  }, []);

  const focusSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
  }, []);

  const toggle = useCallback(() => {
    setOpen((current) => {
      const next = !current;
      if (next) {
        setActiveSectionId((sectionId) => sectionId ?? content.sections[0]?.id ?? null);
      }
      return next;
    });
  }, [content.sections]);

  const value = useMemo(
    () => ({
      content,
      open,
      activeSectionId,
      setOpen,
      openSection,
      focusSection,
      toggle
    }),
    [content, open, activeSectionId, openSection, focusSection, toggle]
  );

  return <ContextHelpContext.Provider value={value}>{children}</ContextHelpContext.Provider>;
}

export function useContextHelp(): ContextHelpContextValue {
  const context = useContext(ContextHelpContext);
  if (!context) {
    throw new Error('useContextHelp must be used within ContextHelpProvider');
  }
  return context;
}

/** Returns null when no provider is mounted — safe for optional field hints. */
export function useOptionalContextHelp(): ContextHelpContextValue | null {
  return useContext(ContextHelpContext);
}
