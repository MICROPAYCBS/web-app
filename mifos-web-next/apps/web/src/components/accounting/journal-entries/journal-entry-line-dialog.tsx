'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  formatJournalEntryAmount,
  formatJournalEntryDate,
  formatJournalEntryDateTime,
  formatJournalEntryDepartment
} from '@/lib/accounting/journal-entry-display';

export function JournalEntryLineDialog({
  entry,
  open,
  onOpenChange
}: {
  entry: FineractJournalEntryListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!entry) {
    return null;
  }

  const amountLabel = entry.entryType.value === 'CREDIT' ? 'Credit' : 'Debit';
  const departmentLabel = formatJournalEntryDepartment(entry);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Journal entry {entry.id}</DialogTitle>
        </DialogHeader>
        <DetailFieldGrid columns={1}>
          <DetailField label="Branch">{entry.officeName}</DetailField>
          {departmentLabel ? (
            <DetailField label="Department">{departmentLabel}</DetailField>
          ) : null}
          <DetailField label="Entry ID">{entry.id}</DetailField>
          <DetailField label="Transaction ID">{entry.transactionId}</DetailField>
          <DetailField label="Transaction date">
            {formatJournalEntryDate(entry.transactionDate)}
          </DetailField>
          <DetailField label="Type">{entry.glAccountType.value}</DetailField>
          <DetailField label="Account code">{entry.glAccountCode}</DetailField>
          <DetailField label="Account name">{entry.glAccountName}</DetailField>
          <DetailField label={amountLabel}>
            {formatJournalEntryAmount(
              entry,
              entry.entryType.value === 'CREDIT' ? 'CREDIT' : 'DEBIT'
            )}
          </DetailField>
          <DetailField label="Currency">
            {entry.currency.name
              ? `(${entry.currency.code}) ${entry.currency.name}`
              : entry.currency.code}
          </DetailField>
          {entry.referenceNumber ? (
            <DetailField label="Reference number">{entry.referenceNumber}</DetailField>
          ) : null}
          {entry.comments ? <DetailField label="Comments">{entry.comments}</DetailField> : null}
          {entry.paymentTypeName ? (
            <DetailField label="Payment type">{entry.paymentTypeName}</DetailField>
          ) : null}
          {entry.createdByUserName ? (
            <DetailField label="Created by">{entry.createdByUserName}</DetailField>
          ) : null}
          <DetailField label="Submitted on">
            {formatJournalEntryDateTime(entry.submittedOnDate)}
          </DetailField>
        </DetailFieldGrid>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
