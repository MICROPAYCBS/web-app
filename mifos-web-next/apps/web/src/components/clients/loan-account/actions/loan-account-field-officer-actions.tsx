'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ArrowRightLeft, MoreHorizontal, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { LoanAccountAssignOfficerSheet } from '@/components/clients/loan-account/actions/loan-account-assign-officer-sheet';
import { LoanAccountReassignOfficerSheet } from '@/components/clients/loan-account/actions/loan-account-reassign-officer-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { loanAccountOfficerVisibility } from '@/lib/fineract/account-field-officer-config';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-accounts';

export interface LoanAccountFieldOfficerPermissions {
  assignOfficer: boolean;
  reassignOfficer: boolean;
}

export function LoanAccountFieldOfficerActions({
  account,
  clientId,
  permissions
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  permissions: LoanAccountFieldOfficerPermissions;
}) {
  const visibility = loanAccountOfficerVisibility(account);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  const showAssign = visibility.assignOfficer && permissions.assignOfficer;
  const showReassign = visibility.reassignOfficer && permissions.reassignOfficer;

  if (!showAssign && !showReassign) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" aria-label="Loan actions">
              <MoreHorizontal className="size-4" aria-hidden />
              Actions
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          {showAssign ? (
            <DropdownMenuItem onClick={() => setAssignOpen(true)}>
              <UserPlus className="size-4" aria-hidden />
              Assign loan officer
            </DropdownMenuItem>
          ) : null}
          {showReassign ? (
            <DropdownMenuItem onClick={() => setReassignOpen(true)}>
              <ArrowRightLeft className="size-4" aria-hidden />
              Reassign loan officer
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <LoanAccountAssignOfficerSheet
        clientId={clientId}
        accountId={account.id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
      <LoanAccountReassignOfficerSheet
        clientId={clientId}
        accountId={account.id}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
      />
    </>
  );
}
