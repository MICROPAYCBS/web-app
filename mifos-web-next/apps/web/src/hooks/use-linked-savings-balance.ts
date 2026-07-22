'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { fetchLinkedSavingsAvailableBalanceAction } from '@/actions/share-account';

export type LinkedSavingsBalance = {
  availableBalance: number | null;
  accountNo?: string;
  currencyCode?: string;
};

/** Loads available balance for a linked savings account when funding from savings. */
export function useLinkedSavingsBalance(
  savingsAccountId: number | null | undefined,
  enabled: boolean
) {
  const [balance, setBalance] = useState<LinkedSavingsBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || savingsAccountId == null || savingsAccountId <= 0) {
      setBalance(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchLinkedSavingsAvailableBalanceAction(savingsAccountId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setBalance(null);
        setError(result.message);
        setLoading(false);
        return;
      }
      setBalance({
        availableBalance: result.availableBalance,
        accountNo: result.accountNo,
        currencyCode: result.currencyCode
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, savingsAccountId]);

  return { balance, loading, error };
}
