'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import { BookOpen, Eye, MoreHorizontal, Pencil, Receipt, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  SavingsTransactionEditSheet
} from '@/components/clients/savings/actions/savings-transaction-edit-sheet';
import {
  SavingsTransactionUndoDialog,
  type SavingsTransactionUndoDialogKind
} from '@/components/clients/savings/actions/savings-transaction-undo-dialog';
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
import {
  savingsAccountTransactionPath,
  savingsAccountTransactionSectionPath
} from '@/lib/fineract/client-account-links';
import {
  savingsTransactionOffersEdit,
  savingsTransactionOffersReceipt,
  savingsTransactionOffersUndo,
  savingsTransactionOffersUndoTransfer,
  type SavingsTransactionActionPermissions
} from '@/lib/fineract/savings-transaction-actions';

export function SavingsTransactionActionsMenu({
  clientId,
  accountId,
  accountNo,
  clientName,
  orgName,
  transaction,
  permissions,
  currencyCode,
  showViewTransaction = false,
  onViewJournal
}: {
  clientId: string;
  accountId: string | number;
  accountNo: string;
  clientName?: string;
  orgName?: string;
  transaction: FineractSavingsAccountTransaction;
  permissions: SavingsTransactionActionPermissions;
  currencyCode: string;
  /** Table row menu: include navigation to the detail page. */
  showViewTransaction?: boolean;
  /** Detail page: switch to journal section instead of navigating away. */
  onViewJournal?: () => void;
}) {
  const router = useRouter();
  const [undoKind, setUndoKind] = useState<SavingsTransactionUndoDialogKind | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const canEdit = permissions.modifyTransaction && savingsTransactionOffersEdit(transaction);
  const canPrintReceipt = savingsTransactionOffersReceipt(transaction);
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

  const journalHref = savingsAccountTransactionSectionPath(
    clientId,
    accountId,
    transaction.id,
    'journal'
  );
  const detailHref = savingsAccountTransactionPath(clientId, accountId, transaction.id);

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
          {canEdit ? (
            <DropdownMenuItem className="whitespace-nowrap" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden />
              Edit transaction
            </DropdownMenuItem>
          ) : null}
          {permissions.undoTransaction && savingsTransactionOffersUndo(transaction) ? (
            <DropdownMenuItem className="whitespace-nowrap" onClick={() => setUndoKind('transaction')}>
              <Undo2 className="size-4" aria-hidden />
              Undo transaction
            </DropdownMenuItem>
          ) : null}
          {permissions.undoTransfer && savingsTransactionOffersUndoTransfer(transaction) ? (
            <DropdownMenuItem className="whitespace-nowrap" onClick={() => setUndoKind('transfer')}>
              <Undo2 className="size-4" aria-hidden />
              Undo transfer
            </DropdownMenuItem>
          ) : null}
          {(canEdit ||
            (permissions.undoTransaction && savingsTransactionOffersUndo(transaction)) ||
            (permissions.undoTransfer && savingsTransactionOffersUndoTransfer(transaction))) &&
          canPrintReceipt ? (
            <DropdownMenuSeparator />
          ) : null}
          {canPrintReceipt && receipt ? (
            <SavingsReceiptDownloadMenuItem receipt={receipt}>
              <Receipt className="size-4" aria-hidden />
              Print receipt
            </SavingsReceiptDownloadMenuItem>
          ) : null}
          {permissions.viewJournal ? (
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

      <SavingsTransactionUndoDialog
        clientId={clientId}
        accountId={accountId}
        transaction={transaction}
        kind={undoKind}
        open={undoKind !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUndoKind(null);
          }
        }}
      />

      {canEdit ? (
        <SavingsTransactionEditSheet
          clientId={clientId}
          accountId={accountId}
          transaction={transaction}
          currencyCode={currencyCode}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
    </>
  );
}
