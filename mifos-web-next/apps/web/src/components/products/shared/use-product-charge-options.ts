'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { pruneProductChargeIds } from '@/lib/fineract/product-charge-options';
import {
  pruneProductChargeAmounts,
  type ProductChargeAmounts
} from '@/lib/fineract/product-charge-links';

type LoadedChargeOptions = {
  chargeOptions?: { id?: number }[];
  penaltyOptions?: { id?: number }[];
};

type FetchChargeOptionsResult =
  | ({ ok: true } & LoadedChargeOptions)
  | { ok: false; message?: string };

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
  fetchOptions: (code: string) => Promise<FetchChargeOptionsResult>;
  setTemplate: Dispatch<SetStateAction<TTemplate>>;
  setDraft: Dispatch<SetStateAction<TDraft>>;
}) {
  useEffect(() => {
    const code = currencyCode?.trim();
    if (!code || !stepsWithChargeOptions.includes(stepId)) {
      return;
    }

    let cancelled = false;

    void fetchOptions(code).then((result) => {
      if (cancelled || !result.ok) {
        return;
      }

      setTemplate((current) => ({
        ...current,
        chargeOptions: result.chargeOptions,
        penaltyOptions: result.penaltyOptions
      }));

      setDraft((current) => {
        const nextIds = pruneProductChargeIds(
          current.charges.chargeIds ?? [],
          result.chargeOptions,
          result.penaltyOptions
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
    });

    return () => {
      cancelled = true;
    };
    // fetchOptions is a stable server action reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when currency or step changes
  }, [currencyCode, stepId, setDraft, setTemplate, stepsWithChargeOptions]);
}
