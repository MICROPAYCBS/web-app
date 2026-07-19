'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { HolidayDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { LockOpen, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { activateHolidayAction, deleteHolidayAction } from '@/actions/holidays';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  formatHolidayDate,
  formatHolidayRepaymentsScheduled,
  holidayStatusLabel,
  isHolidayActive
} from '@/lib/fineract/holiday-display';
import { HOLIDAY_LIST_PATH, holidayEditPath } from '@/lib/fineract/holiday-paths';
import { cn } from '@/lib/utils';

export function HolidayDetailView({
  holiday,
  canEdit,
  canDelete,
  canActivate
}: {
  holiday: HolidayDetail;
  canEdit: boolean;
  canDelete: boolean;
  canActivate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const active = isHolidayActive(holiday.status);

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteHolidayAction(holiday.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(HOLIDAY_LIST_PATH);
      router.refresh();
    });
  }

  function handleActivate() {
    setActionError(null);
    startTransition(async () => {
      const result = await activateHolidayAction(holiday.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setActivateOpen(false);
      router.push(HOLIDAY_LIST_PATH);
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href={HOLIDAY_LIST_PATH} label="Back to holidays" />}
            title={holiday.name}
            actions={
              canEdit || canDelete || (canActivate && !active) ? (
                <div className="flex flex-wrap gap-2">
                  {canActivate && !active ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setActivateOpen(true)}
                    >
                      <LockOpen className="mr-1 size-4" />
                      Activate
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Link
                      href={holidayEditPath(holiday.id)}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <Pencil className="mr-1 size-4" />
                      Edit
                    </Link>
                  ) : null}
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-1 size-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              ) : null
            }
          />
        }
      >
        <DetailSection title="Overview">
          <DetailFieldGrid>
            <DetailField label="Start date">{formatHolidayDate(holiday.fromDate)}</DetailField>
            <DetailField label="End date">{formatHolidayDate(holiday.toDate)}</DetailField>
            <DetailField label="Repayments scheduled to">
              {formatHolidayRepaymentsScheduled(holiday)}
            </DetailField>
            <DetailField label="Status">
              <Badge variant={active ? 'default' : 'secondary'}>
                {holidayStatusLabel(holiday.status)}
              </Badge>
            </DetailField>
            {holiday.description ? (
              <DetailField label="Description">{holiday.description}</DetailField>
            ) : null}
          </DetailFieldGrid>
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete holiday</DialogTitle>
            <DialogDescription>
              Delete &quot;{holiday.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p className="text-sm text-destructive">{actionError}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate holiday</DialogTitle>
            <DialogDescription>
              Activate &quot;{holiday.name}&quot;? Repayments will be rescheduled according to this
              holiday definition.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p className="text-sm text-destructive">{actionError}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActivateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={handleActivate}>
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
