'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractStaffListItem, OrganizationCashierListItem, OrganizationTeller } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteCashierAction } from '@/actions/cashier';
import { CashierFormSheet } from '@/components/organization/cashier-form-sheet';
import { CashiersTable } from '@/components/organization/cashiers-table';
import { DetailBackLink, DetailHeader, DetailPage } from '@/components/composites';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { tellerDetailPath } from '@/lib/fineract/teller-paths';

export function CashiersPageContent({
  teller,
  cashiers,
  staff,
  canAssign,
  canUpdate,
  canDelete
}: {
  teller: OrganizationTeller;
  cashiers: OrganizationCashierListItem[];
  staff: FineractStaffListItem[];
  canAssign: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [editCashier, setEditCashier] = useState<OrganizationCashierListItem | null>(null);
  const [deleteCashier, setDeleteCashier] = useState<OrganizationCashierListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteCashier) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteCashierAction(teller.id, deleteCashier.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteCashier(null);
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href={tellerDetailPath(teller.id)} label="Back to teller" />}
            title={`Cashiers — ${teller.name}`}
            meta={`Branch: ${teller.officeName ?? '—'}`}
            actions={
              canAssign ? (
                <Button type="button" size="sm" onClick={() => setAssignOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Assign cashier
                </Button>
              ) : null
            }
          />
        }
      >
        <CashiersTable
          tellerId={teller.id}
          cashiers={cashiers}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={setEditCashier}
          onDelete={setDeleteCashier}
        />
      </DetailPage>

      {canAssign ? (
        <CashierFormSheet
          open={assignOpen}
          onOpenChange={setAssignOpen}
          mode="assign"
          tellerId={teller.id}
          staff={staff}
        />
      ) : null}

      {canUpdate && editCashier ? (
        <CashierFormSheet
          open={Boolean(editCashier)}
          onOpenChange={(open) => {
            if (!open) {
              setEditCashier(null);
            }
          }}
          mode="edit"
          tellerId={teller.id}
          staff={staff}
          cashier={editCashier}
        />
      ) : null}

      <Dialog open={Boolean(deleteCashier)} onOpenChange={(open) => !open && setDeleteCashier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove cashier assignment</DialogTitle>
            <DialogDescription>
              Remove {deleteCashier?.staffName ?? 'this cashier'} from {teller.name}? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteCashier(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
