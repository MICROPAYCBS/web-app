'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { InvestorTransferItem } from '@mifos/api-client';
import { ChevronDown, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  canCancelInvestorTransfer,
  formatInvestorAmount,
  formatInvestorDate,
  investorStatusLabel
} from '@/lib/fineract/investor-display';
import { cn } from '@/lib/utils';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function ExternalIdValue({ value }: { value?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value?.trim()) {
    return <span>—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <code className="text-xs">{value}</code>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Copy ${value}`}
        onClick={async () => {
          const ok = await copyText(value);
          setCopied(ok);
          if (ok) {
            toast.success('Copied to clipboard.');
          } else {
            toast.error('Could not copy to clipboard.');
          }
        }}
      >
        <Copy className="size-4" />
      </Button>
      {copied ? <span className="text-xs text-muted-foreground">Copied</span> : null}
    </div>
  );
}

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PENDING':
      return 'secondary';
    case 'ACTIVE':
      return 'default';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function InvestorTransferItemCard({
  item,
  onCancel
}: {
  item: InvestorTransferItem;
  onCancel?: (item: InvestorTransferItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const details = item.details;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border">
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-start justify-between gap-4 px-4 py-3 text-left',
          'hover:bg-muted/40'
        )}
      >
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={statusVariant(item.status)}>{investorStatusLabel(item.status)}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Owner external ID</p>
            <ExternalIdValue value={item.owner?.externalId} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Transfer external ID</p>
            <ExternalIdValue value={item.transferExternalId} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Effective from</p>
            <p className="text-sm">{formatInvestorDate(item.effectiveFrom)}</p>
          </div>
        </div>
        <ChevronDown
          className={cn('mt-1 size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-border px-4 py-4">
        <DetailFieldGrid columns={2}>
          <DetailField label="Settlement date">
            {formatInvestorDate(item.settlementDate)}
          </DetailField>
          <DetailField label="Effective date">
            {formatInvestorDate(item.effectiveFrom)}
          </DetailField>
          {item.loanAccount ? (
            <DetailField label="Loan account">{item.loanAccount}</DetailField>
          ) : null}
        </DetailFieldGrid>

        {details ? (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">Outstanding details</h3>
            <DetailFieldGrid columns={2}>
              <DetailField label="Principal outstanding">
                {formatInvestorAmount(details.totalPrincipalOutstanding)}
              </DetailField>
              <DetailField label="Interest outstanding">
                {formatInvestorAmount(details.totalInterestOutstanding)}
              </DetailField>
              <DetailField label="Fees outstanding">
                {formatInvestorAmount(details.totalFeeChargesOutstanding)}
              </DetailField>
              <DetailField label="Penalties outstanding">
                {formatInvestorAmount(details.totalPenaltyChargesOutstanding)}
              </DetailField>
              <DetailField label="Total outstanding">
                {formatInvestorAmount(details.totalOutstanding)}
              </DetailField>
              <DetailField label="Overpaid">
                {formatInvestorAmount(details.totalOverpaid)}
              </DetailField>
            </DetailFieldGrid>
          </div>
        ) : null}

        {canCancelInvestorTransfer(item) && onCancel ? (
          <div className="mt-4 flex justify-end border-t border-border pt-4">
            <Button type="button" variant="destructive" size="sm" onClick={() => onCancel(item)}>
              <Trash2 className="mr-2 size-4" />
              Cancel pending sale
            </Button>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
