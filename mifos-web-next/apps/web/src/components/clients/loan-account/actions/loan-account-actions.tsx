'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  Banknote,
  Check,
  DoorClosed,
  HandCoins,
  HeartCrack,
  MoreHorizontal,
  PiggyBank,
  PlusCircle,
  Trash2,
  Undo2,
  UserX,
  XCircle,
  type LucideIcon
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { LoanAccountAddChargeSheet } from '@/components/clients/loan-account/actions/loan-account-add-charge-sheet';
import { LoanAccountApproveSheet } from '@/components/clients/loan-account/actions/loan-account-approve-sheet';
import { LoanAccountConfirmDialog } from '@/components/clients/loan-account/actions/loan-account-confirm-dialog';
import {
  LoanAccountDisburseSheet,
  type LoanAccountDisburseCommand
} from '@/components/clients/loan-account/actions/loan-account-disburse-sheet';
import {
  LoanAccountLifecycleDialog,
  type LoanAccountLifecycleDialogKind
} from '@/components/clients/loan-account/actions/loan-account-lifecycle-dialog';
import { LoanAccountTransactionSheet } from '@/components/clients/loan-account/actions/loan-account-transaction-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { loanAccountActionVisibility } from '@/lib/fineract/loan-account-command-meta';
import type { LoanAccountTransactionCommand } from '@/lib/fineract/loan-account-command-meta';
import { loanAccountCurrencyCode } from '@/lib/fineract/loan-account-display';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';

export interface LoanAccountActionPermissions {
  approve: boolean;
  reject: boolean;
  withdrawnByApplicant: boolean;
  deleteAccount: boolean;
  undoApproval: boolean;
  disburse: boolean;
  disburseToSavings: boolean;
  undoDisbursal: boolean;
  makeRepayment: boolean;
  addCharge: boolean;
  foreclosure: boolean;
  waiveInterest: boolean;
  writeOff: boolean;
  close: boolean;
  closeAsRescheduled: boolean;
  recoveryPayment: boolean;
  undoWriteOff: boolean;
  assignOfficer: boolean;
  reassignOfficer: boolean;
}

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  separatorBefore?: boolean;
};

export function LoanAccountActions({
  account,
  clientId,
  permissions
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  permissions: LoanAccountActionPermissions;
}) {
  const visibility = loanAccountActionVisibility(account);
  const currencyCode = loanAccountCurrencyCode(account);

  const [lifecycleKind, setLifecycleKind] = useState<LoanAccountLifecycleDialogKind | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [disburseCommand, setDisburseCommand] = useState<LoanAccountDisburseCommand | null>(null);
  const [transactionCommand, setTransactionCommand] = useState<LoanAccountTransactionCommand | null>(
    null
  );
  const [addChargeOpen, setAddChargeOpen] = useState(false);

  const showApprove = visibility.approve && permissions.approve;
  const showDisburse = visibility.disburse && permissions.disburse;
  const showRepayment = visibility.makeRepayment && permissions.makeRepayment;

  const menuItems: MenuItem[] = [];

  if (visibility.reject && permissions.reject) {
    menuItems.push({
      id: 'reject',
      label: 'Reject',
      icon: XCircle,
      onSelect: () => setLifecycleKind('reject'),
      destructive: true
    });
  }
  if (visibility.withdrawnByApplicant && permissions.withdrawnByApplicant) {
    menuItems.push({
      id: 'withdraw',
      label: 'Withdrawn by applicant',
      icon: UserX,
      onSelect: () => setLifecycleKind('withdraw'),
      destructive: true
    });
  }
  if (visibility.deleteAccount && permissions.deleteAccount) {
    menuItems.push({
      id: 'delete',
      label: 'Delete application',
      icon: Trash2,
      onSelect: () => setConfirmDeleteOpen(true),
      destructive: true
    });
  }
  if (visibility.undoApproval && permissions.undoApproval) {
    menuItems.push({
      id: 'undo-approval',
      label: 'Undo approval',
      icon: Undo2,
      onSelect: () => setLifecycleKind('undoApproval')
    });
  }
  if (visibility.undoDisbursal && permissions.undoDisbursal) {
    menuItems.push({
      id: 'undo-disbursal',
      label: 'Undo disbursal',
      icon: Undo2,
      onSelect: () => setLifecycleKind('undoDisbursal'),
      destructive: true
    });
  }
  if (visibility.addCharge && permissions.addCharge) {
    menuItems.push({
      id: 'add-charge',
      label: 'Add charge',
      icon: PlusCircle,
      onSelect: () => setAddChargeOpen(true)
    });
  }
  if (visibility.waiveInterest && permissions.waiveInterest) {
    menuItems.push({
      id: 'waive-interest',
      label: 'Waive interest',
      icon: HandCoins,
      onSelect: () => setTransactionCommand('waiveinterest')
    });
  }
  if (visibility.writeOff && permissions.writeOff) {
    menuItems.push({
      id: 'write-off',
      label: 'Write off',
      icon: HeartCrack,
      onSelect: () => setTransactionCommand('writeoff'),
      destructive: true
    });
  }
  if (visibility.close && permissions.close) {
    menuItems.push({
      id: 'close',
      label: 'Close',
      icon: DoorClosed,
      onSelect: () => setTransactionCommand('close')
    });
  }
  if (visibility.closeAsRescheduled && permissions.closeAsRescheduled) {
    menuItems.push({
      id: 'close-rescheduled',
      label: 'Close as rescheduled',
      icon: DoorClosed,
      onSelect: () => setTransactionCommand('close-rescheduled')
    });
  }
  if (visibility.recoveryPayment && permissions.recoveryPayment) {
    menuItems.push({
      id: 'recovery',
      label: 'Recovery payment',
      icon: Banknote,
      onSelect: () => setTransactionCommand('recoverypayment')
    });
  }
  if (visibility.foreclosure && permissions.foreclosure) {
    menuItems.push({
      id: 'foreclosure',
      label: 'Foreclosure',
      icon: HeartCrack,
      onSelect: () => setTransactionCommand('foreclosure'),
      destructive: true
    });
  }

  const hasPrimary = showApprove || showDisburse || showRepayment;
  const hasMenu = menuItems.length > 0;

  if (!hasPrimary && !hasMenu) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {showApprove ? (
          <Button type="button" onClick={() => setApproveOpen(true)}>
            <Check className="mr-1 size-4" aria-hidden />
            Approve
          </Button>
        ) : null}
        {showDisburse ? (
          <Button type="button" onClick={() => setDisburseCommand('disburse')}>
            <Banknote className="mr-1 size-4" aria-hidden />
            Disburse
          </Button>
        ) : null}
        {visibility.disburseToSavings && permissions.disburseToSavings ? (
          <Button type="button" variant="outline" onClick={() => setDisburseCommand('disbursetosavings')}>
            <PiggyBank className="mr-1 size-4" aria-hidden />
            Disburse to savings
          </Button>
        ) : null}
        {showRepayment ? (
          <Button type="button" onClick={() => setTransactionCommand('repayment')}>
            <HandCoins className="mr-1 size-4" aria-hidden />
            Make repayment
          </Button>
        ) : null}
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" aria-label="More loan actions">
                  <MoreHorizontal className="size-4" aria-hidden />
                  Actions
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {menuItems.map((item) => (
                <Fragment key={item.id}>
                  {item.separatorBefore ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    variant={item.destructive ? 'destructive' : 'default'}
                    onClick={item.onSelect}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <LoanAccountLifecycleDialog
        clientId={clientId}
        accountId={account.id}
        kind={lifecycleKind}
        open={lifecycleKind != null}
        onOpenChange={(open) => {
          if (!open) {
            setLifecycleKind(null);
          }
        }}
      />
      <LoanAccountConfirmDialog
        clientId={clientId}
        accountId={account.id}
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
      />
      <LoanAccountApproveSheet
        clientId={clientId}
        accountId={account.id}
        currencyCode={currencyCode}
        open={approveOpen}
        onOpenChange={setApproveOpen}
      />
      <LoanAccountDisburseSheet
        clientId={clientId}
        accountId={account.id}
        currencyCode={currencyCode}
        command={disburseCommand}
        open={disburseCommand != null}
        onOpenChange={(open) => {
          if (!open) {
            setDisburseCommand(null);
          }
        }}
      />
      <LoanAccountTransactionSheet
        clientId={clientId}
        accountId={account.id}
        currencyCode={currencyCode}
        command={transactionCommand}
        open={transactionCommand != null}
        onOpenChange={(open) => {
          if (!open) {
            setTransactionCommand(null);
          }
        }}
      />
      <LoanAccountAddChargeSheet
        clientId={clientId}
        accountId={account.id}
        currencyCode={currencyCode}
        open={addChargeOpen}
        onOpenChange={setAddChargeOpen}
      />
    </>
  );
}
