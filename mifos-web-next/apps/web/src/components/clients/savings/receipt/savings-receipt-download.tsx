'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Printer } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { SavingsReceiptDocument } from '@/components/clients/savings/receipt/savings-receipt-document';
import type { SavingsReceiptData } from '@/components/clients/savings/receipt/savings-receipt-view-model';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

function receiptFileName(transactionId: number): string {
  return `receipt_${transactionId}.pdf`;
}

export function SavingsReceiptDownloadButton({
  receipt,
  className,
  variant = 'default',
  size = 'default',
  label = 'Print receipt'
}: {
  receipt: SavingsReceiptData;
  className?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  label?: string;
}) {
  return (
    <PDFDownloadLink
      document={<SavingsReceiptDocument receipt={receipt} />}
      fileName={receiptFileName(receipt.transactionId)}
    >
      {({ loading }) => (
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          disabled={loading}
        >
          <Printer className="size-4" aria-hidden />
          {loading ? 'Generating…' : label}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

export function SavingsReceiptDownloadMenuItem({
  receipt,
  children
}: {
  receipt: SavingsReceiptData;
  children?: ReactNode;
}) {
  return (
    <PDFDownloadLink
      document={<SavingsReceiptDocument receipt={receipt} />}
      fileName={receiptFileName(receipt.transactionId)}
      style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
    >
      {({ loading }) => (
        <DropdownMenuItem disabled={loading} className="flex items-center gap-2 whitespace-nowrap">
          {children ?? (
            <>
              <Printer className="size-4" aria-hidden />
              {loading ? 'Generating…' : 'Print receipt'}
            </>
          )}
        </DropdownMenuItem>
      )}
    </PDFDownloadLink>
  );
}
