'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationTeller } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Pencil, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteTellerAction } from '@/actions/teller';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { formatTellerStatus, isTellerActive } from '@/lib/fineract/teller-display';
import {
  TELLER_LIST_PATH,
  tellerCashiersPath,
  tellerEditPath
} from '@/lib/fineract/teller-paths';
import { cn } from '@/lib/utils';

export function TellerDetailView({
  teller,
  canEdit,
  canDelete
}: {
  teller: OrganizationTeller;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = isTellerActive(teller.status);

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteTellerAction(teller.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(TELLER_LIST_PATH);
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href={TELLER_LIST_PATH} label="Back to tellers" />}
            title={teller.name}
            status={{
              label: formatTellerStatus(teller.status),
              variant: active ? 'default' : 'secondary'
            }}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={tellerCashiersPath(teller.id)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  <Users className="mr-2 size-4" />
                  View cashiers
                </Link>
                {canEdit ? (
                  <Link
                    href={tellerEditPath(teller.id)}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit teller
                  </Link>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setActionError(null);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
        }
      >
        <DetailSection title="Teller information">
          <DetailFieldGrid>
            <DetailField label="Teller name">{teller.name}</DetailField>
            <DetailField label="Branch">{teller.officeName ?? '—'}</DetailField>
            {teller.description ? (
              <DetailField label="Description">{teller.description}</DetailField>
            ) : null}
            <DetailField label="Start date">
              {formatFineractDateArray(teller.startDate) ?? '—'}
            </DetailField>
            {teller.endDate ? (
              <DetailField label="End date">
                {formatFineractDateArray(teller.endDate) ?? '—'}
              </DetailField>
            ) : null}
            <DetailField label="Status">{formatTellerStatus(teller.status)}</DetailField>
          </DetailFieldGrid>
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete teller</DialogTitle>
            <DialogDescription>
              Delete {teller.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
