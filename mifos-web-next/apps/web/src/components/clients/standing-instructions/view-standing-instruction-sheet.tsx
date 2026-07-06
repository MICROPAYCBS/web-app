'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionDetail } from '@mifos/api-client';
import { useEffect, useState, useTransition } from 'react';
import { fetchStandingInstructionDetailAction } from '@/actions/client-standing-instruction';
import { DetailField, DetailFieldGrid, DetailSection } from '@/components/composites';
import { DOCKED_SHEET_LAYOUT_CLASSNAME } from '@/components/composites/form-sheet';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  standingInstructionAccountLabel,
  standingInstructionClientLabel,
  standingInstructionEnumLabel,
  standingInstructionValidityLabel
} from '@/lib/fineract/standing-instruction-display';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

function formatMonthDay(value?: number[] | string): string {
  if (typeof value === 'string') {
    return value.trim() || '—';
  }
  return formatFineractDateArray(value) ?? '—';
}

function standingInstructionDestinationLabel(detail: StandingInstructionDetail): string {
  if (
    detail.fromClient?.id != null &&
    detail.toClient?.id != null &&
    detail.fromClient.id === detail.toClient.id
  ) {
    return 'Own account';
  }
  return 'Within bank';
}

export function ViewStandingInstructionSheet({
  instructionId,
  open,
  onOpenChange
}: {
  instructionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<StandingInstructionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || instructionId == null) {
      setDetail(null);
      setError(null);
      return;
    }

    startTransition(async () => {
      const result = await fetchStandingInstructionDetailAction(instructionId);
      if ('ok' in result) {
        setDetail(null);
        setError(result.message);
        return;
      }
      setError(null);
      setDetail(result);
    });
  }, [open, instructionId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className={cn(
          DOCKED_SHEET_LAYOUT_CLASSNAME,
          'data-[side=right]:w-full data-[side=right]:sm:max-w-xl'
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>
            {detail?.name?.trim() || (pending ? 'Loading…' : 'Standing instruction')}
          </SheetTitle>
          <SheetDescription>Automated transfer configuration.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {pending ? (
            <p className="text-sm text-muted-foreground">Loading standing instruction…</p>
          ) : null}
          {error ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {detail ? (
            <DetailSection title="Details">
              <DetailFieldGrid>
                <DetailField label="Applicant">
                  {standingInstructionClientLabel(detail.fromClient)}
                </DetailField>
                <DetailField label="Transfer type">
                  {standingInstructionEnumLabel(detail.transferType)}
                </DetailField>
                <DetailField label="Priority">
                  {standingInstructionEnumLabel(detail.priority)}
                </DetailField>
                <DetailField label="Status">
                  {standingInstructionEnumLabel(detail.status)}
                </DetailField>
                <DetailField label="From account type">
                  {standingInstructionEnumLabel(detail.fromAccountType)}
                </DetailField>
                <DetailField label="From account">
                  {standingInstructionAccountLabel(detail.fromAccount)}
                </DetailField>
                <DetailField label="Destination">
                  {standingInstructionDestinationLabel(detail)}
                </DetailField>
                <DetailField label="To office">{detail.toOffice?.name ?? '—'}</DetailField>
                <DetailField label="Beneficiary">
                  {standingInstructionClientLabel(detail.toClient)}
                </DetailField>
                <DetailField label="To account type">
                  {standingInstructionEnumLabel(detail.toAccountType)}
                </DetailField>
                <DetailField label="To account">
                  {standingInstructionAccountLabel(detail.toAccount)}
                </DetailField>
                <DetailField label="Instruction type">
                  {standingInstructionEnumLabel(detail.instructionType)}
                </DetailField>
                <DetailField label="Amount">
                  {detail.amount != null ? String(detail.amount) : '—'}
                </DetailField>
                <DetailField label="Validity">
                  {standingInstructionValidityLabel(detail.validFrom, detail.validTill)}
                </DetailField>
                <DetailField label="Recurrence type">
                  {standingInstructionEnumLabel(detail.recurrenceType)}
                </DetailField>
                <DetailField label="Interval">
                  {detail.recurrenceInterval != null ? String(detail.recurrenceInterval) : '—'}
                </DetailField>
                <DetailField label="Recurrence frequency">
                  {standingInstructionEnumLabel(detail.recurrenceFrequency)}
                </DetailField>
                <DetailField label="On month day">
                  {formatMonthDay(detail.recurrenceOnMonthDay)}
                </DetailField>
              </DetailFieldGrid>
            </DetailSection>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
