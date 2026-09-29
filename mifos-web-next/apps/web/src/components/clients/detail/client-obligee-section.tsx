/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailSection } from '@/components/composites';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import type { ClientObligeeRecord } from '@/lib/fineract/loan-account-types';

export function ClientObligeeSection({ items }: { items: ClientObligeeRecord[] }) {
  return (
    <DetailSection
      title="Loans guaranteed"
      description="Loans where this customer has pledged savings as a guarantor."
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This customer has not pledged savings for another loan.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Borrower</TableHead>
              <TableHead>Loan</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Pledged</TableHead>
              <TableHead>Released</TableHead>
              <TableHead>Transferred</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.accountNumber ?? 'loan'}-${item.guaranteeAmount ?? 0}`}>
                <TableCell>{item.displayName ?? '—'}</TableCell>
                <TableCell className="tabular-nums">{item.accountNumber ?? '—'}</TableCell>
                <TableCell className="tabular-nums">
                  {formatAccountMoney(item.loanAmount)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatAccountMoney(item.guaranteeAmount)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatAccountMoney(item.amountReleased)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatAccountMoney(item.amountTransferred)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DetailSection>
  );
}
