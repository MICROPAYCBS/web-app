'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyBucketDetail, DelinquencyBucketQueryType } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteDelinquencyBucketAction } from '@/actions/delinquency-bucket';
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
import {
  formatDelinquencyBucketType,
  formatDelinquencyDays,
  formatDelinquencyEnumLabel,
  sortDelinquencyRanges
} from '@/lib/fineract/delinquency-display';
import {
  delinquencyBucketEditPath,
  delinquencyBucketsListPath
} from '@/lib/fineract/delinquency-paths';
import { cn } from '@/lib/utils';

export function DelinquencyBucketDetailView({
  bucket,
  bucketType,
  canEdit,
  canDelete
}: {
  bucket: DelinquencyBucketDetail;
  bucketType: DelinquencyBucketQueryType;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const paymentRule = bucket.minimumPaymentPeriodAndRule;
  const ranges = sortDelinquencyRanges(bucket.ranges ?? []);

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteDelinquencyBucketAction(String(bucket.id));
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(delinquencyBucketsListPath());
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={delinquencyBucketsListPath()} label="Back to delinquency buckets" />
            }
            title={bucket.name ?? `Bucket #${bucket.id}`}
            actions={
              canEdit || canDelete ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Link
                      href={delinquencyBucketEditPath(bucket.id, bucketType)}
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
            <DetailField label="Type">{formatDelinquencyBucketType(bucket.bucketType)}</DetailField>
            <DetailField label="Name">{bucket.name ?? '—'}</DetailField>
            {paymentRule ? (
              <>
                <DetailField label="Frequency">
                  {paymentRule.frequency !== undefined ? String(paymentRule.frequency) : '—'}
                </DetailField>
                <DetailField label="Frequency type">
                  {formatDelinquencyEnumLabel(paymentRule.frequencyType)}
                </DetailField>
                <DetailField label="Minimum payment">
                  {paymentRule.minimumPayment !== undefined
                    ? String(paymentRule.minimumPayment)
                    : '—'}
                </DetailField>
                <DetailField label="Minimum payment type">
                  {formatDelinquencyEnumLabel(paymentRule.minimumPaymentType)}
                </DetailField>
              </>
            ) : null}
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title="Delinquency ranges">
          {ranges.length ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Classification</th>
                    <th className="px-3 py-2 text-right font-medium">Days from</th>
                    <th className="px-3 py-2 text-right font-medium">Days till</th>
                  </tr>
                </thead>
                <tbody>
                  {ranges.map((range) => (
                    <tr key={range.id} className="border-t border-border">
                      <td className="px-3 py-2">{range.classification ?? '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatDelinquencyDays(range.minimumAgeDays)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatDelinquencyDays(range.maximumAgeDays)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No ranges assigned.</p>
          )}
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete delinquency bucket?</DialogTitle>
            <DialogDescription>
              This permanently removes {bucket.name ?? 'this delinquency bucket'}. Loan products
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
