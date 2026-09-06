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
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  Calculator,
  Check,
  MoreHorizontal,
  Pencil,
  Percent,
  PlusCircle,
  Power,
  Trash2,
  Undo2,
  UserX,
  XCircle,
  type LucideIcon
} from 'lucide-react';
import { Fragment, useState } from 'react';
import {
  AccountOfficerActions,
  type AccountOfficerPermissions
} from '@/components/clients/accounts/actions/account-officer-actions';
import { DepositAccountAddChargeSheet } from '@/components/clients/accounts/actions/deposit-account-add-charge-sheet';
import { DepositAccountCloseSheet } from '@/components/clients/accounts/actions/deposit-account-close-sheet';
import {
  DepositAccountConfirmDialog,
  type DepositAccountConfirmDialogKind
} from '@/components/clients/accounts/actions/deposit-account-confirm-dialog';
import {
  DepositAccountLifecycleDialog,
  type DepositAccountLifecycleDialogKind
} from '@/components/clients/accounts/actions/deposit-account-lifecycle-dialog';
import { DepositAccountPrematureCloseSheet } from '@/components/clients/accounts/actions/deposit-account-premature-close-sheet';
import { DepositAccountTransactionSheet } from '@/components/clients/accounts/actions/deposit-account-transaction-sheet';
import { EditClientDepositAccountSheet } from '@/components/clients/accounts/edit-client-deposit-account-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  depositAccountActionVisibility,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';
import { savingsAccountCurrencyCode } from '@/lib/fineract/savings-account-display';

export interface DepositAccountActionPermissions {
  approve: boolean;
  activate: boolean;
  reject: boolean;
  withdrawnByApplicant: boolean;
  undoApproval: boolean;
  undoActivation: boolean;
  prematureClose: boolean;
  close: boolean;
  calculateInterest: boolean;
  postInterest: boolean;
  deposit: boolean;
  withdrawal: boolean;
  deleteAccount: boolean;
  addCharge: boolean;
  modifyApplication: boolean;
  officer: AccountOfficerPermissions;
}

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  separatorBefore?: boolean;
};

export function DepositAccountActions({
  kind,
  account,
  clientId,
  permissions,
  reportOrgName
}: {
  kind: TermDepositAccountKind;
  account: FineractSavingsAccountDetail;
  clientId: string;
  permissions: DepositAccountActionPermissions;
  reportOrgName?: string;
}) {
  const visibility = depositAccountActionVisibility(account, kind);
  const currencyCode = savingsAccountCurrencyCode(account);
  const accountId = account.id;

  const [lifecycleKind, setLifecycleKind] = useState<DepositAccountLifecycleDialogKind | null>(
    null
  );
  const [confirmKind, setConfirmKind] = useState<DepositAccountConfirmDialogKind | null>(null);
  const [prematureCloseOpen, setPrematureCloseOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [transactionCommand, setTransactionCommand] = useState<'deposit' | 'withdrawal' | null>(
    null
  );
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);

  const showApprove = visibility.approve && permissions.approve;
  const showActivate = visibility.activate && permissions.activate;
  const showDeposit = visibility.deposit && permissions.deposit;
  const showWithdrawal = visibility.withdrawal && permissions.withdrawal;
  const showPrematureClose = visibility.prematureClose && permissions.prematureClose;
  const showClose = visibility.close && permissions.close;
  const showModify = visibility.modifyApplication && permissions.modifyApplication;

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
  if (visibility.undoActivation && permissions.undoActivation) {
    menuItems.push({
      id: 'undo-activation',
      label: 'Undo activation',
      icon: Undo2,
      onSelect: () => setLifecycleKind('undoActivation')
    });
  }
  if (visibility.addCharge && permissions.addCharge) {
    menuItems.push({
      id: 'add-charge',
      label: 'Add charge',
      icon: PlusCircle,
      onSelect: () => setAddChargeOpen(true),
      separatorBefore: menuItems.length > 0
    });
  }
  if (visibility.calculateInterest && permissions.calculateInterest) {
    menuItems.push({
      id: 'calculate-interest',
      label: 'Calculate interest',
      icon: Calculator,
      onSelect: () => setConfirmKind('calculateInterest'),
      separatorBefore: menuItems.length > 0
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

  const hasPrimary =
    showApprove ||
    showActivate ||
    showDeposit ||
    showWithdrawal ||
    showPrematureClose ||
    showClose ||
    showModify;
  const hasOverflow = menuItems.length > 0;

  if (!hasPrimary && !hasOverflow) {
    return (
      <AccountOfficerActions
        kind={kind}
        account={account}
        clientId={clientId}
        permissions={permissions.officer}
        presentation="inline"
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {showModify ? (
          <Button type="button" variant="outline" onClick={() => setModifyOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Modify application
          </Button>
        ) : null}
        {showApprove ? (
          <Button type="button" onClick={() => setLifecycleKind('approve')}>
            <Check className="mr-2 size-4" />
            Approve
          </Button>
        ) : null}
        {showActivate ? (
          <Button type="button" onClick={() => setLifecycleKind('activate')}>
            <Power className="mr-2 size-4" />
            Activate
          </Button>
        ) : null}
        {showDeposit ? (
          <Button type="button" onClick={() => setTransactionCommand('deposit')}>
            <ArrowUpCircle className="mr-2 size-4" />
            Deposit
          </Button>
        ) : null}
        {showWithdrawal ? (
          <Button type="button" variant="outline" onClick={() => setTransactionCommand('withdrawal')}>
            <ArrowDownCircle className="mr-2 size-4" />
            Withdrawal
          </Button>
        ) : null}
        {showPrematureClose ? (
          <Button type="button" variant="outline" onClick={() => setPrematureCloseOpen(true)}>
            <ArrowLeft className="mr-2 size-4" />
            Premature close
          </Button>
        ) : null}
        {showClose ? (
          <Button type="button" onClick={() => setCloseOpen(true)}>
            <ArrowRight className="mr-2 size-4" />
            Close
          </Button>
        ) : null}

        <AccountOfficerActions
          kind={kind}
          account={account}
          clientId={clientId}
          permissions={permissions.officer}
          presentation="inline"
        />

        {hasOverflow ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-72">
              {menuItems.map((item) => (
                <Fragment key={item.id}>
                  {item.separatorBefore ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    onClick={item.onSelect}
                    className={item.destructive ? 'text-destructive focus:text-destructive' : undefined}
                  >
                    <item.icon className="mr-2 size-4" />
                    {item.label}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <DepositAccountLifecycleDialog
        kind={kind}
        clientId={clientId}
        accountId={accountId}
        dialogKind={lifecycleKind}
        open={lifecycleKind != null}
        onOpenChange={(next) => {
          if (!next) {
            setLifecycleKind(null);
          }
        }}
      />
      <DepositAccountConfirmDialog
        kind={kind}
        clientId={clientId}
        accountId={accountId}
        dialogKind={confirmKind}
        open={confirmKind != null}
        onOpenChange={(next) => {
          if (!next) {
            setConfirmKind(null);
          }
        }}
      />
      <DepositAccountPrematureCloseSheet
        kind={kind}
        clientId={clientId}
        accountId={accountId}
        currencyCode={currencyCode}
        open={prematureCloseOpen}
        onOpenChange={setPrematureCloseOpen}
      />
      <DepositAccountCloseSheet
        kind={kind}
        clientId={clientId}
        accountId={accountId}
        currencyCode={currencyCode}
        open={closeOpen}
        onOpenChange={setCloseOpen}
      />
      <DepositAccountTransactionSheet
        kind={kind}
        clientId={clientId}
        accountId={accountId}
        accountNo={account.accountNo}
        clientName={account.clientName}
        orgName={reportOrgName}
        command={transactionCommand}
        currencyCode={currencyCode}
        open={transactionCommand != null}
        onOpenChange={(next) => {
          if (!next) {
            setTransactionCommand(null);
          }
        }}
      />
      <DepositAccountAddChargeSheet
        kind={kind}
        clientId={clientId}
        accountId={accountId}
        currencyCode={currencyCode}
        open={addChargeOpen}
        onOpenChange={setAddChargeOpen}
      />
      <EditClientDepositAccountSheet
        kind={kind}
        clientId={clientId}
        accountId={accountId}
        open={modifyOpen}
        onOpenChange={setModifyOpen}
      />
    </>
  );
}
