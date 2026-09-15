'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  interpretProductChargeOptionsResult,
  PRODUCT_CHARGE_OPTIONS_FALLBACK_ERROR,
  pruneProductChargeIds,
  type ProductChargeOptionsFetchResult
} from '@/lib/fineract/product-charge-options';
import {
  pruneProductChargeAmounts,
  type ProductChargeAmounts
} from '@/lib/fineract/product-charge-links';

type DraftWithCharges = {
  charges: { chargeIds?: number[]; chargeAmounts?: ProductChargeAmounts };
};

type TemplateWithChargeOptions = {
  chargeOptions?: unknown[];
  penaltyOptions?: unknown[];
};

export function useProductChargeOptions<
  TDraft extends DraftWithCharges,
  TTemplate extends TemplateWithChargeOptions
>({
  currencyCode,
  stepId,
  stepsWithChargeOptions,
  fetchOptions,
  setTemplate,
  setDraft
}: {
  currencyCode?: string;
  stepId: string;
  stepsWithChargeOptions: readonly string[];
  fetchOptions: (code: string) => Promise<ProductChargeOptionsFetchResult>;
  setTemplate: Dispatch<SetStateAction<TTemplate>>;
  setDraft: Dispatch<SetStateAction<TDraft>>;
}): {
  loading: boolean;
  loadError: string | null;
  retry: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const needsChargeOptions = stepsWithChargeOptions.includes(stepId);

  const retry = useCallback(() => {
    setRetryToken((current) => current + 1);
  }, []);

  useEffect(() => {
    const code = currencyCode?.trim();
    if (!code || !needsChargeOptions) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void fetchOptions(code)
      .then((result) => {
        if (cancelled) {
          return;
        }
        const interpreted = interpretProductChargeOptionsResult(result);
        setLoading(false);
        if (!interpreted.ok) {
          setLoadError(interpreted.message);
          return;
        }

        setLoadError(null);
        setTemplate((current) => ({
          ...current,
          chargeOptions: interpreted.chargeOptions,
          penaltyOptions: interpreted.penaltyOptions
        }));

        setDraft((current) => {
          const nextIds = pruneProductChargeIds(
            current.charges.chargeIds ?? [],
            interpreted.chargeOptions,
            interpreted.penaltyOptions
          );
          const nextAmounts = pruneProductChargeAmounts(nextIds, current.charges.chargeAmounts);
          if (
            nextIds.length === (current.charges.chargeIds ?? []).length &&
            Object.keys(nextAmounts).length === Object.keys(current.charges.chargeAmounts ?? {}).length
          ) {
            return current;
          }
          return {
            ...current,
            charges: { ...current.charges, chargeIds: nextIds, chargeAmounts: nextAmounts }
          };
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setLoading(false);
        setLoadError(PRODUCT_CHARGE_OPTIONS_FALLBACK_ERROR);
      });

    return () => {
      cancelled = true;
    };
    // fetchOptions is a stable server action reference or a thin wrapper around one.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when currency, step, or retry changes
  }, [currencyCode, needsChargeOptions, retryToken, setDraft, setTemplate]);

  return { loading, loadError, retry };
}
