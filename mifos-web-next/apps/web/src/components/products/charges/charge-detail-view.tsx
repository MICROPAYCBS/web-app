'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteChargeAction } from '@/actions/charge';
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
  chargeAppliesToLabel,
  chargeCalculationTypeLabel,
  chargeCurrencyCode,
  chargePaymentModeLabel,
  chargeTimeTypeLabel,
  formatChargeAmountDisplay,
  glAccountLabel
} from '@/lib/fineract/charge-display';
import { chargeEditPath, chargeListPath } from '@/lib/fineract/charge-paths';
import { enumOptionLabel, formatYesNo } from '@/lib/fineract/client-detail-labels';
import { cn } from '@/lib/utils';

export function ChargeDetailView({
  charge,
  canEdit,
  canDelete
}: {
  charge: ChargeDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const currencyCode = chargeCurrencyCode(charge);
  const amountLabel = formatChargeAmountDisplay(
    charge,
    currencyCode === '—' ? undefined : currencyCode
  );
  const capDisplayContext = {
    currencyCode: charge.currencyCode ?? charge.currency?.code,
    chargeCalculationType: charge.chargeCalculationType
  };
  const codeForCaps = currencyCode === '—' ? undefined : currencyCode;

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteChargeAction(String(charge.id));
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(chargeListPath());
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href={chargeListPath()} label="Back to charges" />}
            title={charge.name ?? `Charge #${charge.id}`}
            actions={
              <div className="flex gap-2">
                {canEdit ? (
                  <Link
                    href={chargeEditPath(charge.id)}
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
                    onClick={() => setDeleteOpen(true)}
                    disabled={pending}
                  >
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
        }
      >
        <DetailSection title="General">
          <DetailFieldGrid>
            <DetailField label="Applies to">{chargeAppliesToLabel(charge)}</DetailField>
            <DetailField label="Penalty">{formatYesNo(charge.penalty)}</DetailField>
            <DetailField label="Currency">{currencyCode}</DetailField>
            <DetailField label="Amount">{amountLabel}</DetailField>
            <DetailField label="Charge time type">{chargeTimeTypeLabel(charge)}</DetailField>
            <DetailField label="Calculation type">{chargeCalculationTypeLabel(charge)}</DetailField>
            <DetailField label="Payment mode">{chargePaymentModeLabel(charge)}</DetailField>
            <DetailField label="Active">{formatYesNo(charge.active)}</DetailField>
            {charge.minCap != null ? (
              <DetailField label="Minimum cap">
                {formatChargeAmountDisplay(
                  { ...capDisplayContext, amount: charge.minCap },
                  codeForCaps
                )}
              </DetailField>
            ) : null}
            {charge.maxCap != null ? (
              <DetailField label="Maximum cap">
                {formatChargeAmountDisplay(
                  { ...capDisplayContext, amount: charge.maxCap },
                  codeForCaps
                )}
              </DetailField>
            ) : null}
            {charge.feeFrequency ? (
              <DetailField label="Fee frequency">
                {enumOptionLabel(charge.feeFrequency)}
              </DetailField>
            ) : null}
            {charge.feeInterval != null ? (
              <DetailField label="Frequency interval">{charge.feeInterval}</DetailField>
            ) : null}
            {charge.incomeOrLiabilityAccount ? (
              <DetailField label="Income from charge">
                {glAccountLabel(charge.incomeOrLiabilityAccount)}
              </DetailField>
            ) : null}
            {charge.taxGroup?.name ? (
              <DetailField label="Tax group">{charge.taxGroup.name}</DetailField>
            ) : null}
          </DetailFieldGrid>
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete charge</DialogTitle>
            <DialogDescription>
              Delete {charge.name ?? 'this charge'}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p className="text-sm text-destructive">{actionError}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
