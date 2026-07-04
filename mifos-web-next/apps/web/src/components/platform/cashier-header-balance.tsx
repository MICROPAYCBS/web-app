'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CashierNavBalance } from '@/lib/fineract/cashier-display';
import {
  formatCashierNavBalanceLabel,
  formatCashierNavBalanceLines
} from '@/lib/fineract/cashier-display';
import { tellerCashierDetailPath } from '@/lib/fineract/teller-paths';
import { cn } from '@/lib/utils';

function balanceTooltip(balance: CashierNavBalance): string {
  const lines = formatCashierNavBalanceLines(balance).map((line) => `${line} net cash`);
  return ['Your cashier', ...lines].join('\n');
}

const triggerClassName =
  'inline-flex min-w-0 max-w-[min(100%,28rem)] items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

export function CashierHeaderBalance({ balance }: { balance: CashierNavBalance }) {
  const label = formatCashierNavBalanceLabel(balance);
  const href = balance.canOpenCashierDetail
    ? tellerCashierDetailPath(balance.tellerId, balance.cashierId)
    : null;

  const content = (
    <>
      <Wallet className="size-4 shrink-0 opacity-60" aria-hidden />
      <span className="truncate font-medium text-foreground">{label}</span>
    </>
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          href ? (
            <Link href={href} className={triggerClassName} aria-label="Your cashier balance">
              {content}
            </Link>
          ) : (
            <span className={cn(triggerClassName, 'cursor-default')} aria-label="Your cashier balance">
              {content}
            </span>
          )
        }
      />
      <TooltipContent side="bottom" className="whitespace-pre-line">
        {balanceTooltip(balance)}
      </TooltipContent>
    </Tooltip>
  );
}
