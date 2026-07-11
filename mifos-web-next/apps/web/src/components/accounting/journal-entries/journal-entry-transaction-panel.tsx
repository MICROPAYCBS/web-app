'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import { resolvePermission, useCan } from '@mifos/auth';
import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { getJournalEntryTransactionAction } from '@/actions/journal-entries';
import { JournalEntryTransactionSheet } from '@/components/accounting/journal-entries/journal-entry-transaction-sheet';
import { journalEntryTransactionPath } from '@/lib/accounting/journal-entry-links';
import { cn } from '@/lib/utils';

export type JournalEntryTransactionOpenInput =
  | string
  | {
      transactionId: string;
      entries?: FineractJournalEntryListItem[];
    };

type JournalEntryTransactionPanelContextValue = {
  canView: boolean;
  openJournalTransaction: (input: JournalEntryTransactionOpenInput) => void;
  closeJournalTransaction: () => void;
};

const JournalEntryTransactionPanelContext =
  createContext<JournalEntryTransactionPanelContextValue | null>(null);

function resolveTransactionOpenRequest(input: JournalEntryTransactionOpenInput): {
  transactionId: string;
  entries: FineractJournalEntryListItem[] | null;
} {
  if (typeof input === 'string') {
    return { transactionId: input.trim(), entries: null };
  }
  return {
    transactionId: input.transactionId.trim(),
    entries: input.entries ?? null
  };
}

function loadTransaction(
  transactionId: string,
  onComplete: (result: {
    entries: FineractJournalEntryListItem[];
    error: string | null;
    loading: boolean;
  }) => void
) {
  onComplete({ entries: [], error: null, loading: true });
  void getJournalEntryTransactionAction(transactionId).then((result) => {
    if (!result.ok) {
      onComplete({ entries: [], error: result.message, loading: false });
      return;
    }
    onComplete({ entries: result.entries, error: null, loading: false });
  });
}

export function JournalEntryTransactionPanelProvider({ children }: { children: ReactNode }) {
  const canView = useCan(resolvePermission('accounting.journal'));
  const [open, setOpen] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [entries, setEntries] = useState<FineractJournalEntryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeJournalTransaction = useCallback(() => {
    setOpen(false);
  }, []);

  const openJournalTransaction = useCallback(
    (input: JournalEntryTransactionOpenInput) => {
      if (!canView) {
        return;
      }

      const request = resolveTransactionOpenRequest(input);
      if (!request.transactionId) {
        return;
      }

      setOpen(true);
      setTransactionId(request.transactionId);
      setError(null);

      if (request.entries && request.entries.length > 0) {
        setEntries(request.entries);
        setLoading(false);
        return;
      }

      setEntries([]);
      loadTransaction(request.transactionId, ({ entries: nextEntries, error: nextError, loading: nextLoading }) => {
        setLoading(nextLoading);
        setError(nextError);
        setEntries(nextEntries);
      });
    },
    [canView]
  );

  const handleReverted = useCallback(
    (result: { transactionId?: string }) => {
      const nextTransactionId = result.transactionId?.trim();
      if (nextTransactionId && nextTransactionId !== transactionId) {
        setTransactionId(nextTransactionId);
        setEntries([]);
        loadTransaction(nextTransactionId, ({ entries: nextEntries, error: nextError, loading: nextLoading }) => {
          setLoading(nextLoading);
          setError(nextError);
          setEntries(nextEntries);
        });
        return;
      }

      if (transactionId) {
        setEntries([]);
        loadTransaction(transactionId, ({ entries: nextEntries, error: nextError, loading: nextLoading }) => {
          setLoading(nextLoading);
          setError(nextError);
          setEntries(nextEntries);
        });
      }
    },
    [transactionId]
  );

  const value = useMemo(
    () => ({
      canView,
      openJournalTransaction,
      closeJournalTransaction
    }),
    [canView, openJournalTransaction, closeJournalTransaction]
  );

  return (
    <JournalEntryTransactionPanelContext.Provider value={value}>
      {children}
      {canView ? (
        <JournalEntryTransactionSheet
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setTransactionId(null);
              setEntries([]);
              setError(null);
              setLoading(false);
            }
          }}
          transactionId={transactionId}
          entries={entries}
          loading={loading}
          error={error}
          onReverted={handleReverted}
        />
      ) : null}
    </JournalEntryTransactionPanelContext.Provider>
  );
}

export function useJournalEntryTransactionPanel(): JournalEntryTransactionPanelContextValue {
  const context = useContext(JournalEntryTransactionPanelContext);
  if (!context) {
    throw new Error(
      'useJournalEntryTransactionPanel must be used within JournalEntryTransactionPanelProvider'
    );
  }
  return context;
}

export function useOptionalJournalEntryTransactionPanel(): JournalEntryTransactionPanelContextValue | null {
  return useContext(JournalEntryTransactionPanelContext);
}

export function JournalEntryTransactionLink({
  transactionId,
  entries,
  children,
  className
}: {
  transactionId: string;
  entries?: FineractJournalEntryListItem[];
  children?: ReactNode;
  className?: string;
}) {
  const panel = useOptionalJournalEntryTransactionPanel();
  const label = children ?? transactionId;
  const href = journalEntryTransactionPath(transactionId);
  const openInput: JournalEntryTransactionOpenInput =
    entries && entries.length > 0 ? { transactionId, entries } : transactionId;

  if (!panel?.canView) {
    return (
      <Link href={href} className={cn('font-medium text-primary underline-offset-4 hover:underline', className)}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'font-medium text-primary underline-offset-4 hover:underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      onClick={() => panel.openJournalTransaction(openInput)}
    >
      {label}
    </button>
  );
}
