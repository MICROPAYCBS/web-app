'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { BookOpen, Eye, MoreHorizontal, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoanTransactionUndoDialog } from '@/components/clients/loan-account/actions/loan-transaction-undo-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  loanAccountTransactionPath,
  loanAccountTransactionSectionPath
} from '@/lib/fineract/client-account-links';
import type { FineractLoanAccountTransaction } from '@/lib/fineract/loan-account-types';
import {
  loanTransactionOffersUndo,
  loanTransactionUndoIsWriteOff,
  type LoanTransactionActionPermissions
} from '@/lib/fineract/loan-transaction-actions';

export function LoanTransactionActionsMenu({
  clientId,
  accountId,
  transaction,
  permissions,
  showViewTransaction = false,
  onViewJournal
}: {
  clientId: string;
  accountId: string | number;
  transaction: FineractLoanAccountTransaction;
  permissions: LoanTransactionActionPermissions;
  /** Table row menu: include navigation to the detail page. */
  showViewTransaction?: boolean;
  /** Detail page: switch to journal section instead of navigating away. */
  onViewJournal?: () => void;
}) {
  const router = useRouter();
  const [undoOpen, setUndoOpen] = useState(false);
  const writeOff = loanTransactionUndoIsWriteOff(transaction);
  const canUndo =
    loanTransactionOffersUndo(transaction) &&
    (writeOff ? permissions.undoWriteOff : permissions.undoTransaction);
  const canViewJournal = permissions.viewJournal;
  const hasItems = showViewTransaction || canUndo || canViewJournal;

  if (!hasItems) {
    return null;
  }

  const journalHref = loanAccountTransactionSectionPath(
    clientId,
    accountId,
    transaction.id,
    'journal'
  );
  const detailHref = loanAccountTransactionPath(clientId, accountId, transaction.id);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Transaction actions"
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-72 w-max"
          onClick={(event) => event.stopPropagation()}
        >
          {showViewTransaction ? (
            <DropdownMenuItem className="whitespace-nowrap" onClick={() => router.push(detailHref)}>
              <Eye className="size-4" aria-hidden />
              View transaction
            </DropdownMenuItem>
          ) : null}
          {canUndo ? (
            <DropdownMenuItem className="whitespace-nowrap" onClick={() => setUndoOpen(true)}>
              <Undo2 className="size-4" aria-hidden />
              Undo transaction
            </DropdownMenuItem>
          ) : null}
          {canViewJournal ? (
            <DropdownMenuItem
              className="whitespace-nowrap"
              onClick={() => {
                if (onViewJournal) {
                  onViewJournal();
                  return;
                }
                router.push(journalHref);
              }}
            >
              <BookOpen className="size-4" aria-hidden />
              View journal entries
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canUndo ? (
        <LoanTransactionUndoDialog
          clientId={clientId}
          accountId={accountId}
          transaction={transaction}
          open={undoOpen}
          onOpenChange={setUndoOpen}
        />
      ) : null}
    </>
  );
}
