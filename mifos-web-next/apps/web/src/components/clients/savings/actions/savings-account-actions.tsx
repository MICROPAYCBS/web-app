'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountDetail } from '@mifos/api-client';
import { ArrowDownCircle, ArrowUpCircle, Check, MoreHorizontal, Power } from 'lucide-react';
import { Fragment, useState } from 'react';
import { SavingsAccountBlockDialog } from '@/components/clients/savings/actions/savings-account-block-dialog';
import { SavingsAccountCloseSheet } from '@/components/clients/savings/actions/savings-account-close-sheet';
import {
  SavingsAccountLifecycleDialog,
  type SavingsAccountLifecycleDialogKind
} from '@/components/clients/savings/actions/savings-account-lifecycle-dialog';
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
import type { SavingsAccountTransactionCommand } from '@/lib/fineract/savings-account-commands';
import type { SavingsAccountBlockDialogKind } from '@/components/clients/savings/actions/savings-account-block-dialog';

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
}

export function SavingsAccountActions({
  account,
  clientId,
  permissions
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  permissions: SavingsAccountActionPermissions;
}) {
  const visibility = savingsAccountActionVisibility(account);
  const currencyCode = savingsAccountCurrencyCode(account);

  const [lifecycleKind, setLifecycleKind] = useState<SavingsAccountLifecycleDialogKind | null>(
    null
  );
  const [blockKind, setBlockKind] = useState<SavingsAccountBlockDialogKind | null>(null);
  const [transactionCommand, setTransactionCommand] =
    useState<SavingsAccountTransactionCommand | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);

  const showApprove = visibility.approve && permissions.approve;
  const showActivate = visibility.activate && permissions.activate;
  const showDeposit = visibility.deposit && permissions.deposit;
  const showWithdraw = visibility.withdraw && permissions.withdraw;

  type MenuItem = {
    id: string;
    label: string;
    onSelect: () => void;
    destructive?: boolean;
    separatorBefore?: boolean;
  };

  const menuItems: MenuItem[] = [];

  if (visibility.reject && permissions.reject) {
    menuItems.push({
      id: 'reject',
      label: 'Reject',
      onSelect: () => setLifecycleKind('reject'),
      destructive: true
    });
  }
  if (visibility.withdrawnByApplicant && permissions.withdrawnByApplicant) {
    menuItems.push({
      id: 'withdrawn',
      label: 'Withdrawn by applicant',
      onSelect: () => setLifecycleKind('withdrawnByApplicant'),
      destructive: true
    });
  }
  if (visibility.undoApproval && permissions.undoApproval) {
    menuItems.push({
      id: 'undo-approval',
      label: 'Undo approval',
      onSelect: () => setLifecycleKind('undoApproval')
    });
  }
  if (visibility.block && permissions.block) {
    menuItems.push({
      id: 'block',
      label: 'Block account',
      onSelect: () => setBlockKind('block'),
      destructive: true
    });
  }
  if (visibility.unblock && permissions.unblock) {
    menuItems.push({
      id: 'unblock',
      label: 'Unblock account',
      onSelect: () => setLifecycleKind('unblock')
    });
  }
  if (visibility.blockCredit && permissions.blockCredit) {
    menuItems.push({
      id: 'block-credit',
      label: 'Block deposits',
      onSelect: () => setBlockKind('blockCredit'),
      destructive: true
    });
  }
  if (visibility.unblockCredit && permissions.unblockCredit) {
    menuItems.push({
      id: 'unblock-credit',
      label: 'Unblock deposits',
      onSelect: () => setLifecycleKind('unblockCredit')
    });
  }
  if (visibility.blockDebit && permissions.blockDebit) {
    menuItems.push({
      id: 'block-debit',
      label: 'Block withdrawals',
      onSelect: () => setBlockKind('blockDebit'),
      destructive: true
    });
  }
  if (visibility.unblockDebit && permissions.unblockDebit) {
    menuItems.push({
      id: 'unblock-debit',
      label: 'Unblock withdrawals',
      onSelect: () => setLifecycleKind('unblockDebit')
    });
  }
  if (visibility.close && permissions.close) {
    menuItems.push({
      id: 'close',
      label: 'Close account',
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
            <DropdownMenuContent align="end">
              {menuItems.map((item) => (
                <Fragment key={item.id}>
                  {item.separatorBefore ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    variant={item.destructive ? 'destructive' : 'default'}
                    onClick={item.onSelect}
                  >
                    {item.label}
                  </DropdownMenuItem>
                </Fragment>
              ))}
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
      <SavingsAccountTransactionSheet
        clientId={clientId}
        accountId={account.id}
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
        open={closeOpen}
        onOpenChange={setCloseOpen}
      />
    </>
  );
}
