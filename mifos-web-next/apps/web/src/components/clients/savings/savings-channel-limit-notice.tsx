'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  SavingsAccountChannelLimit,
  SavingsAccountPaymentChannel,
  SavingsChannelLimitDirection
} from '@mifos/api-client';
import { useEffect, useState } from 'react';
import { loadSavingsAccountChannelLimitsAction } from '@/actions/savings-account-command';
import {
  channelLimitIsEnforced,
  formatChannelCap,
  formatChannelRemaining
} from '@/lib/fineract/savings-channel-limits';

export function SavingsChannelLimitNotice({
  accountId,
  paymentChannels,
  paymentTypeId,
  direction,
  transactionDate,
  businessDate,
  currencyCode
}: {
  accountId: number;
  paymentChannels: SavingsAccountPaymentChannel[];
  paymentTypeId: number;
  direction: SavingsChannelLimitDirection;
  transactionDate: string;
  businessDate: string;
  currencyCode: string;
}) {
  const channel = paymentChannels.find((row) => row.paymentTypeId === paymentTypeId);
  const productPaymentChannelId = channel?.id;
  const [limit, setLimit] = useState<SavingsAccountChannelLimit | null>(null);

  useEffect(() => {
    if (productPaymentChannelId == null || !Number.isFinite(paymentTypeId)) {
      setLimit(null);
      return;
    }
    let cancelled = false;
    void loadSavingsAccountChannelLimitsAction(
      String(accountId),
      productPaymentChannelId,
      direction
    ).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setLimit(null);
        return;
      }
      const match = result.limits.find((row) => row.direction === direction);
      setLimit(match && channelLimitIsEnforced(match) ? match : null);
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, direction, paymentTypeId, productPaymentChannelId]);

  if (!limit) {
    return null;
  }

  const sameBusinessDate = transactionDate.trim() === businessDate.trim();

  return (
    <div className="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
      <p>
        Per transaction{' '}
        {formatChannelCap(limit.effectivePerTxn, 'amount', currencyCode)}
      </p>
      {sameBusinessDate ? (
        <>
          <p>
            Remaining today {formatChannelRemaining(limit.remainingToday, 'amount', currencyCode)}
            {' · '}
            count {formatChannelRemaining(limit.remainingCountToday, 'count', currencyCode)}
          </p>
          <p>
            Remaining this month{' '}
            {formatChannelRemaining(limit.remainingThisMonth, 'amount', currencyCode)}
            {' · '}
            count {formatChannelRemaining(limit.remainingCountThisMonth, 'count', currencyCode)}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">The limit is checked for the transaction date.</p>
      )}
    </div>
  );
}
