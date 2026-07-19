'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyRangeDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteDelinquencyRangeAction } from '@/actions/delinquency-range';
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
import { formatDelinquencyDays } from '@/lib/fineract/delinquency-display';
import {
  delinquencyRangeEditPath,
  delinquencyRangesListPath
} from '@/lib/fineract/delinquency-paths';
import { cn } from '@/lib/utils';

export function DelinquencyRangeDetailView({
  range,
  canEdit,
  canDelete
}: {
  range: DelinquencyRangeDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteDelinquencyRangeAction(String(range.id));
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(delinquencyRangesListPath());
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={delinquencyRangesListPath()} label="Back to delinquency ranges" />
            }
            title={range.classification ?? `Range #${range.id}`}
            actions={
              canEdit || canDelete ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Link
                      href={delinquencyRangeEditPath(range.id)}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <Pencil className="mr-1 size-4" />
                      Edit
                    </Link>
                  ) : null}
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      disabled={pending}
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
        <DetailSection title="Details">
          <DetailFieldGrid>
            <DetailField label="Classification">{range.classification ?? '—'}</DetailField>
            <DetailField label="Days from">
              {formatDelinquencyDays(range.minimumAgeDays)}
            </DetailField>
            <DetailField label="Days till">
              {formatDelinquencyDays(range.maximumAgeDays)}
            </DetailField>
          </DetailFieldGrid>
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete delinquency range?</DialogTitle>
            <DialogDescription>
              This permanently removes {range.classification ?? 'this delinquency range'}. Buckets
              that reference it may be affected.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
