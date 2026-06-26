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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { depositAccountFieldOfficerVisibility } from '@/lib/fineract/account-field-officer-config';

export interface DepositAccountFieldOfficerPermissions {
  assignStaff: boolean;
  reassignStaff: boolean;
}

export function DepositAccountFieldOfficerActions({
  account,
  clientId,
  kind,
  permissions
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  kind: ClientDepositAccountKind;
  permissions: DepositAccountFieldOfficerPermissions;
}) {
  const visibility = depositAccountFieldOfficerVisibility(account);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  const showAssign = visibility.assignStaff && permissions.assignStaff;
  const showReassign = visibility.reassignStaff && permissions.reassignStaff;

  if (!showAssign && !showReassign) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" aria-label="Account actions">
              <MoreHorizontal className="size-4" aria-hidden />
              Actions
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          {showAssign ? (
            <DropdownMenuItem onClick={() => setAssignOpen(true)}>
              <UserPlus className="size-4" aria-hidden />
              Assign field officer
            </DropdownMenuItem>
          ) : null}
          {showReassign ? (
            <DropdownMenuItem onClick={() => setReassignOpen(true)}>
              <ArrowRightLeft className="size-4" aria-hidden />
              Reassign field officer
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <DepositAccountAssignOfficerSheet
        clientId={clientId}
        accountId={account.id}
        kind={kind}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
      <DepositAccountReassignOfficerSheet
        clientId={clientId}
        accountId={account.id}
        kind={kind}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
      />
    </>
  );
}
