'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind, FineractSavingsAccountDetail } from '@mifos/api-client';
import { ArrowRightLeft, MoreHorizontal, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { DepositAccountAssignOfficerSheet } from '@/components/clients/accounts/actions/deposit-account-assign-officer-sheet';
import { DepositAccountReassignOfficerSheet } from '@/components/clients/accounts/actions/deposit-account-reassign-officer-sheet';
import { LoanAccountAssignOfficerSheet } from '@/components/clients/loan-account/actions/loan-account-assign-officer-sheet';
import { LoanAccountReassignOfficerSheet } from '@/components/clients/loan-account/actions/loan-account-reassign-officer-sheet';
import { SavingsAccountAssignStaffSheet } from '@/components/clients/savings/actions/savings-account-assign-staff-sheet';
import { SavingsAccountReassignStaffSheet } from '@/components/clients/savings/actions/savings-account-reassign-staff-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  depositAccountFieldOfficerVisibility,
  loanAccountOfficerVisibility,
  LOAN_OFFICER_CONFIG
} from '@/lib/fineract/account-field-officer-config';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { savingsAccountActionVisibility } from '@/lib/fineract/savings-account-display';

export interface AccountOfficerPermissions {
  assign: boolean;
  reassign: boolean;
}

export type AccountOfficerKind = 'loan' | ClientDepositAccountKind;

function officerLabels(kind: AccountOfficerKind): { assign: string; reassign: string } {
  if (kind === 'loan') {
    return {
      assign: `Assign ${LOAN_OFFICER_CONFIG.officerLabel.toLowerCase()}`,
      reassign: `Reassign ${LOAN_OFFICER_CONFIG.officerLabel.toLowerCase()}`
    };
  }
  return {
    assign: 'Assign field officer',
    reassign: 'Reassign field officer'
  };
}

function officerVisibility(
  kind: AccountOfficerKind,
  account: FineractLoanAccountDetail | FineractSavingsAccountDetail
): { assign: boolean; reassign: boolean } {
  if (kind === 'loan') {
    const visibility = loanAccountOfficerVisibility(account as FineractLoanAccountDetail);
    return { assign: visibility.assignOfficer, reassign: visibility.reassignOfficer };
  }
  if (kind === 'savings') {
    const visibility = savingsAccountActionVisibility(account as FineractSavingsAccountDetail);
    return { assign: visibility.assignStaff, reassign: visibility.reassignStaff };
  }
  const visibility = depositAccountFieldOfficerVisibility(account as FineractSavingsAccountDetail);
  return { assign: visibility.assignStaff, reassign: visibility.reassignStaff };
}

export function AccountOfficerActions({
  kind,
  account,
  clientId,
  permissions,
  presentation = 'standalone'
}: {
  kind: AccountOfficerKind;
  account: FineractLoanAccountDetail | FineractSavingsAccountDetail;
  clientId: string;
  permissions: AccountOfficerPermissions;
  /** Standalone = only header control (e.g. deposit detail). Inline = beside lifecycle actions. */
  presentation?: 'standalone' | 'inline';
}) {
  const visibility = officerVisibility(kind, account);
  const labels = officerLabels(kind);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  const showAssign = visibility.assign && permissions.assign;
  const showReassign = visibility.reassign && permissions.reassign;

  if (!showAssign && !showReassign) {
    return null;
  }

  const accountId = account.id;
  const triggerLabel = presentation === 'inline' ? 'Officer' : 'Actions';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" aria-label={`${triggerLabel} actions`}>
              <MoreHorizontal className="size-4" aria-hidden />
              {triggerLabel}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          {showAssign ? (
            <DropdownMenuItem onClick={() => setAssignOpen(true)}>
              <UserPlus className="size-4" aria-hidden />
              {labels.assign}
            </DropdownMenuItem>
          ) : null}
          {showReassign ? (
            <DropdownMenuItem onClick={() => setReassignOpen(true)}>
              <ArrowRightLeft className="size-4" aria-hidden />
              {labels.reassign}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {kind === 'loan' ? (
        <>
          <LoanAccountAssignOfficerSheet
            clientId={clientId}
            accountId={accountId}
            open={assignOpen}
            onOpenChange={setAssignOpen}
          />
          <LoanAccountReassignOfficerSheet
            clientId={clientId}
            accountId={accountId}
            open={reassignOpen}
            onOpenChange={setReassignOpen}
          />
        </>
      ) : null}

      {kind === 'savings' ? (
        <>
          <SavingsAccountAssignStaffSheet
            clientId={clientId}
            accountId={accountId}
            open={assignOpen}
            onOpenChange={setAssignOpen}
          />
          <SavingsAccountReassignStaffSheet
            clientId={clientId}
            accountId={accountId}
            open={reassignOpen}
            onOpenChange={setReassignOpen}
          />
        </>
      ) : null}

      {kind === 'fixedDeposit' || kind === 'recurringDeposit' ? (
        <>
          <DepositAccountAssignOfficerSheet
            clientId={clientId}
            accountId={accountId}
            kind={kind}
            open={assignOpen}
            onOpenChange={setAssignOpen}
          />
          <DepositAccountReassignOfficerSheet
            clientId={clientId}
            accountId={accountId}
            kind={kind}
            open={reassignOpen}
            onOpenChange={setReassignOpen}
          />
        </>
      ) : null}
    </>
  );
}
