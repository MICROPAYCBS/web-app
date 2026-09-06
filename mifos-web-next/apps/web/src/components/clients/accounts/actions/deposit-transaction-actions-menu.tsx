'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import { BookOpen, Eye, MoreHorizontal, Receipt, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useJournalEntryTransactionPanel } from '@/components/accounting/journal-entries/journal-entry-transaction-panel';
import { DepositTransactionUndoDialog } from '@/components/clients/accounts/actions/deposit-transaction-undo-dialog';
import { DepositTransactionViewSheet } from '@/components/clients/accounts/actions/deposit-transaction-view-sheet';
import {
  buildSavingsReceiptFromTransaction,
  SavingsReceiptDownloadMenuItem
} from '@/components/clients/savings/receipt';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { savingsJournalTransactionId } from '@/lib/accounting/journal-entry-links';
import type { TermDepositAccountKind } from '@/lib/fineract/deposit-account-display';
import {
  depositTransactionOffersReceipt,
  depositTransactionOffersUndo,
  type DepositTransactionActionPermissions
} from '@/lib/fineract/deposit-transaction-actions';

export function DepositTransactionActionsMenu({
  kind,
  clientId,
  accountId,
  accountNo,
  clientName,
  orgName,
  transaction,
  permissions,
  currencyCode
}: {
  kind: TermDepositAccountKind;
  clientId: string;
  accountId: string | number;
  accountNo: string;
  clientName?: string;
  orgName?: string;
  transaction: FineractSavingsAccountTransaction;
  permissions: DepositTransactionActionPermissions;
  currencyCode: string;
}) {
  const { canView, openJournalTransaction } = useJournalEntryTransactionPanel();
  const [viewOpen, setViewOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);

  const canUndo = permissions.undoTransaction && depositTransactionOffersUndo(transaction);
  const canPrintReceipt = depositTransactionOffersReceipt(transaction);
  const canViewJournal = permissions.viewJournal && canView;
  const receipt = useMemo(
    () =>
      canPrintReceipt
        ? buildSavingsReceiptFromTransaction(
            transaction,
            { accountNo, clientName },
            currencyCode,
            orgName
          )
        : null,
    [accountNo, canPrintReceipt, clientName, currencyCode, orgName, transaction]
  );

  const showSeparator = canPrintReceipt || canViewJournal;

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
          <DropdownMenuItem className="whitespace-nowrap" onClick={() => setViewOpen(true)}>
            <Eye className="size-4" aria-hidden />
            View transaction
          </DropdownMenuItem>
          {canUndo ? (
            <DropdownMenuItem className="whitespace-nowrap" onClick={() => setUndoOpen(true)}>
              <Undo2 className="size-4" aria-hidden />
              Undo transaction
            </DropdownMenuItem>
          ) : null}
          {showSeparator ? <DropdownMenuSeparator /> : null}
          {canPrintReceipt && receipt ? (
            <SavingsReceiptDownloadMenuItem receipt={receipt}>
              <Receipt className="size-4" aria-hidden />
              Print receipt
            </SavingsReceiptDownloadMenuItem>
          ) : null}
          {canViewJournal ? (
            <DropdownMenuItem
              className="whitespace-nowrap"
              onClick={() => openJournalTransaction(savingsJournalTransactionId(transaction.id))}
            >
              <BookOpen className="size-4" aria-hidden />
              View journal entries
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <DepositTransactionViewSheet
        transaction={transaction}
        accountCurrencyCode={currencyCode}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <DepositTransactionUndoDialog
        kind={kind}
        clientId={clientId}
        accountId={accountId}
        transaction={transaction}
        open={undoOpen}
        onOpenChange={setUndoOpen}
      />
    </>
  );
}
