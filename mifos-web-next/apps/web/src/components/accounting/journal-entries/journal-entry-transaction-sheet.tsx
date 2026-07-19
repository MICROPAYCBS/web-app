'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import { ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { JournalEntryTransactionContent } from '@/components/accounting/journal-entries/journal-entry-transaction-content';
import { DOCKED_SHEET_LAYOUT_CLASSNAME } from '@/components/composites/form-sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { journalEntryTransactionPath } from '@/lib/accounting/journal-entry-links';
import { cn } from '@/lib/utils';

export function JournalEntryTransactionSheet({
  open,
  onOpenChange,
  transactionId,
  entries,
  loading = false,
  error,
  onReverted
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
  entries: FineractJournalEntryListItem[];
  loading?: boolean;
  error?: string | null;
  onReverted?: (result: { transactionId?: string }) => void;
}) {
  const title = transactionId ? `Transaction ${transactionId}` : 'Journal transaction';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className={cn(
          DOCKED_SHEET_LAYOUT_CLASSNAME,
          'data-[side=right]:w-full data-[side=right]:sm:max-w-2xl'
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>{loading && !transactionId ? 'Loading transaction…' : title}</SheetTitle>
          <SheetDescription>
            Review journal lines, metadata, and reverse manual entries without leaving this screen.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading journal transaction…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : transactionId ? (
            <JournalEntryTransactionContent
              transactionId={transactionId}
              entries={entries}
              onReverted={onReverted}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Select a transaction to view details.</p>
          )}
        </div>

        {transactionId ? (
          <SheetFooter className="shrink-0 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Link
              href={journalEntryTransactionPath(transactionId)}
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              <ExternalLink className="mr-2 size-4" />
              Open full page
            </Link>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
