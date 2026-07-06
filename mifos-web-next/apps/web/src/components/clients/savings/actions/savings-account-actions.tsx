'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountDetail } from '@mifos/api-client';
import {
  ArrowDownCircle,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpCircle,
  ArrowUpFromLine,
  Calculator,
  CalendarClock,
  Check,
  DoorClosed,
  Landmark,
  Lock,
  LockOpen,
  MoreHorizontal,
  PauseCircle,
  Percent,
  PlusCircle,
  Power,
  Trash2,
  Undo2,
  UserPlus,
  UserX,
  XCircle,
  type LucideIcon
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { SavingsAccountAddChargeSheet } from '@/components/clients/savings/actions/savings-account-add-charge-sheet';
import { SavingsAccountApplyAnnualFeesSheet } from '@/components/clients/savings/actions/savings-account-apply-annual-fees-sheet';
import type { SavingsAccountBlockDialogKind } from '@/components/clients/savings/actions/savings-account-block-dialog';
import { SavingsAccountBlockDialog } from '@/components/clients/savings/actions/savings-account-block-dialog';
import { SavingsAccountCloseSheet } from '@/components/clients/savings/actions/savings-account-close-sheet';
import {
  SavingsAccountConfirmDialog,
  type SavingsAccountConfirmDialogKind
} from '@/components/clients/savings/actions/savings-account-confirm-dialog';
import { SavingsAccountHoldAmountSheet } from '@/components/clients/savings/actions/savings-account-hold-amount-sheet';
import {
  SavingsAccountLifecycleDialog,
  type SavingsAccountLifecycleDialogKind
} from '@/components/clients/savings/actions/savings-account-lifecycle-dialog';
import { SavingsAccountPostInterestAsOnSheet } from '@/components/clients/savings/actions/savings-account-post-interest-as-on-sheet';
import { SavingsAccountTransferFundsSheet } from '@/components/clients/savings/actions/savings-account-transfer-funds-sheet';
import { SavingsAccountTransactionSheet } from '@/components/clients/savings/actions/savings-account-transaction-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  savingsAccountActionVisibility,
  savingsAccountCurrencyCode
} from '@/lib/fineract/savings-account-display';

export interface SavingsAccountActionPermissions {
  approve: boolean;
  activate: boolean;
  reject: boolean;
  withdrawnByApplicant: boolean;
  undoApproval: boolean;
  deposit: boolean;
  withdraw: boolean;
  close: boolean;
  block: boolean;
  unblock: boolean;
  blockCredit: boolean;
  unblockCredit: boolean;
  blockDebit: boolean;
  unblockDebit: boolean;
  calculateInterest: boolean;
  postInterest: boolean;
  postInterestAsOn: boolean;
  addCharge: boolean;
  applyAnnualFees: boolean;
  holdAmount: boolean;
  transferFunds: boolean;
  assignStaff: boolean;
  reassignStaff: boolean;
  enableWithholdTax: boolean;
  disableWithholdTax: boolean;
  deleteAccount: boolean;
}

type DepositWithdrawCommand = 'deposit' | 'withdrawal';

export function SavingsAccountActions({
  account,
  clientId,
  reportOrgName,
  permissions
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  reportOrgName: string;
  permissions: SavingsAccountActionPermissions;
}) {
  const visibility = savingsAccountActionVisibility(account);
  const currencyCode = savingsAccountCurrencyCode(account);

  const [lifecycleKind, setLifecycleKind] = useState<SavingsAccountLifecycleDialogKind | null>(
    null
  );
  const [blockKind, setBlockKind] = useState<SavingsAccountBlockDialogKind | null>(null);
  const [transactionCommand, setTransactionCommand] = useState<DepositWithdrawCommand | null>(
    null
  );
  const [confirmKind, setConfirmKind] = useState<SavingsAccountConfirmDialogKind | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [postInterestAsOnOpen, setPostInterestAsOnOpen] = useState(false);
  const [holdAmountOpen, setHoldAmountOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [applyAnnualFeesOpen, setApplyAnnualFeesOpen] = useState(false);
  const [transferFundsOpen, setTransferFundsOpen] = useState(false);

  const showApprove = visibility.approve && permissions.approve;
  const showActivate = visibility.activate && permissions.activate;
  const showDeposit = visibility.deposit && permissions.deposit;
  const showWithdraw = visibility.withdraw && permissions.withdraw;

  type MenuItem = {
    id: string;
    label: string;
    icon: LucideIcon;
    onSelect: () => void;
    destructive?: boolean;
    separatorBefore?: boolean;
  };

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
      id: 'withdrawn',
      label: 'Withdrawn by applicant',
      icon: UserX,
      onSelect: () => setLifecycleKind('withdrawnByApplicant'),
      destructive: true
    });
  }
  if (visibility.deleteAccount && permissions.deleteAccount) {
    menuItems.push({
      id: 'delete',
      label: 'Delete account',
      icon: Trash2,
      onSelect: () => setConfirmKind('deleteAccount'),
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
  if (visibility.addCharge && permissions.addCharge) {
    menuItems.push({
      id: 'add-charge',
      label: 'Add charge',
      icon: PlusCircle,
      onSelect: () => setAddChargeOpen(true)
    });
  }
  if (visibility.calculateInterest && permissions.calculateInterest) {
    menuItems.push({
      id: 'calculate-interest',
      label: 'Calculate interest',
      icon: Calculator,
      onSelect: () => setConfirmKind('calculateInterest')
    });
  }
  if (visibility.postInterest && permissions.postInterest) {
    menuItems.push({
      id: 'post-interest',
      label: 'Post interest',
      icon: Percent,
      onSelect: () => setConfirmKind('postInterest')
    });
  }
  if (visibility.postInterestAsOn && permissions.postInterestAsOn) {
    menuItems.push({
      id: 'post-interest-as-on',
      label: 'Post interest as on',
      icon: CalendarClock,
      onSelect: () => setPostInterestAsOnOpen(true)
    });
  }
  if (visibility.applyAnnualFees && permissions.applyAnnualFees) {
    menuItems.push({
      id: 'apply-annual-fees',
      label: 'Apply annual fee',
      icon: Landmark,
      onSelect: () => setApplyAnnualFeesOpen(true)
    });
  }
  if (visibility.holdAmount && permissions.holdAmount) {
    menuItems.push({
      id: 'hold-amount',
      label: 'Hold amount',
      icon: PauseCircle,
      onSelect: () => setHoldAmountOpen(true)
    });
  }
  if (visibility.transferFunds && permissions.transferFunds) {
    menuItems.push({
      id: 'transfer-funds',
      label: 'Transfer funds',
      icon: ArrowRightLeft,
      onSelect: () => setTransferFundsOpen(true)
    });
  }
  if (visibility.enableWithholdTax && permissions.enableWithholdTax) {
    menuItems.push({
      id: 'enable-withhold-tax',
      label: 'Enable withhold tax',
      icon: Landmark,
      onSelect: () => setConfirmKind('enableWithholdTax')
    });
  }
  if (visibility.disableWithholdTax && permissions.disableWithholdTax) {
    menuItems.push({
      id: 'disable-withhold-tax',
      label: 'Disable withhold tax',
      icon: Landmark,
      onSelect: () => setConfirmKind('disableWithholdTax')
    });
  }
  if (visibility.block && permissions.block) {
    menuItems.push({
      id: 'block',
      label: 'Block account',
      icon: Lock,
      onSelect: () => setBlockKind('block'),
      destructive: true,
      separatorBefore: menuItems.length > 0
    });
  }
  if (visibility.unblock && permissions.unblock) {
    menuItems.push({
      id: 'unblock',
      label: 'Unblock account',
      icon: LockOpen,
      onSelect: () => setLifecycleKind('unblock')
    });
  }
  if (visibility.blockCredit && permissions.blockCredit) {
    menuItems.push({
      id: 'block-credit',
      label: 'Block deposits',
      icon: ArrowDownToLine,
      onSelect: () => setBlockKind('blockCredit'),
      destructive: true
    });
  }
  if (visibility.unblockCredit && permissions.unblockCredit) {
    menuItems.push({
      id: 'unblock-credit',
      label: 'Unblock deposits',
      icon: LockOpen,
      onSelect: () => setLifecycleKind('unblockCredit')
    });
  }
  if (visibility.blockDebit && permissions.blockDebit) {
    menuItems.push({
      id: 'block-debit',
      label: 'Block withdrawals',
      icon: ArrowUpFromLine,
      onSelect: () => setBlockKind('blockDebit'),
      destructive: true
    });
  }
  if (visibility.unblockDebit && permissions.unblockDebit) {
    menuItems.push({
      id: 'unblock-debit',
      label: 'Unblock withdrawals',
      icon: LockOpen,
      onSelect: () => setLifecycleKind('unblockDebit')
    });
  }
  if (visibility.close && permissions.close) {
    menuItems.push({
      id: 'close',
      label: 'Close account',
      icon: DoorClosed,
      onSelect: () => setCloseOpen(true),
      destructive: true,
      separatorBefore: menuItems.length > 0
    });
  }

  const hasPrimary = showApprove || showActivate || showDeposit || showWithdraw;
  const hasMenu = menuItems.length > 0;

  if (!hasPrimary && !hasMenu) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {showApprove ? (
          <Button type="button" size="sm" onClick={() => setLifecycleKind('approve')}>
            <Check className="mr-1 size-4" />
            Approve
          </Button>
        ) : null}
        {showActivate ? (
          <Button type="button" size="sm" onClick={() => setLifecycleKind('activate')}>
            <Power className="mr-1 size-4" />
            Activate
          </Button>
        ) : null}
        {showDeposit ? (
          <Button type="button" size="sm" onClick={() => setTransactionCommand('deposit')}>
            <ArrowDownCircle className="mr-1 size-4" />
            Deposit
          </Button>
        ) : null}
        {showWithdraw ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setTransactionCommand('withdrawal')}>
            <ArrowUpCircle className="mr-1 size-4" />
            Withdraw
          </Button>
        ) : null}
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" size="icon" variant="outline" aria-label="More actions" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Fragment key={item.id}>
                    {item.separatorBefore ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuItem
                      variant={item.destructive ? 'destructive' : 'default'}
                      className="whitespace-nowrap"
                      onClick={item.onSelect}
                    >
                      <Icon className="size-4" aria-hidden />
                      {item.label}
                    </DropdownMenuItem>
                  </Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <SavingsAccountLifecycleDialog
        clientId={clientId}
        accountId={account.id}
        kind={lifecycleKind}
        open={lifecycleKind !== null}
        onOpenChange={(next) => {
          if (!next) {
            setLifecycleKind(null);
          }
        }}
      />
      <SavingsAccountBlockDialog
        clientId={clientId}
        accountId={account.id}
        kind={blockKind}
        open={blockKind !== null}
        onOpenChange={(next) => {
          if (!next) {
            setBlockKind(null);
          }
        }}
      />
      <SavingsAccountConfirmDialog
        clientId={clientId}
        accountId={account.id}
        kind={confirmKind}
        open={confirmKind !== null}
        onOpenChange={(next) => {
          if (!next) {
            setConfirmKind(null);
          }
        }}
      />
      <SavingsAccountTransactionSheet
        clientId={clientId}
        accountId={account.id}
        accountNo={account.accountNo}
        clientName={account.clientName}
        orgName={reportOrgName}
        command={transactionCommand}
        currencyCode={currencyCode}
        open={transactionCommand !== null}
        onOpenChange={(next) => {
          if (!next) {
            setTransactionCommand(null);
          }
        }}
      />
      <SavingsAccountCloseSheet
        clientId={clientId}
        accountId={account.id}
        currencyCode={currencyCode}
        open={closeOpen}
        onOpenChange={setCloseOpen}
      />
      <SavingsAccountPostInterestAsOnSheet
        clientId={clientId}
        accountId={account.id}
        open={postInterestAsOnOpen}
        onOpenChange={setPostInterestAsOnOpen}
      />
      <SavingsAccountHoldAmountSheet
        clientId={clientId}
        accountId={account.id}
        currencyCode={currencyCode}
        open={holdAmountOpen}
        onOpenChange={setHoldAmountOpen}
      />
      <SavingsAccountAddChargeSheet
        clientId={clientId}
        accountId={account.id}
        currencyCode={currencyCode}
        open={addChargeOpen}
        onOpenChange={setAddChargeOpen}
      />
      <SavingsAccountApplyAnnualFeesSheet
        clientId={clientId}
        accountId={account.id}
        currencyCode={currencyCode}
        open={applyAnnualFeesOpen}
        onOpenChange={setApplyAnnualFeesOpen}
      />
      <SavingsAccountTransferFundsSheet
        clientId={clientId}
        account={account}
        currencyCode={currencyCode}
        open={transferFundsOpen}
        onOpenChange={setTransferFundsOpen}
      />
    </>
  );
}
