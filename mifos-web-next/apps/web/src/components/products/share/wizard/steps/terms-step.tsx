'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductTermsInput } from '@mifos/validation';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import type { ShareProductStepProps } from '../types';

function computeShareCapital(sharesIssued?: number, unitPrice?: number): number | undefined {
  if (sharesIssued == null || unitPrice == null) {
    return undefined;
  }
  return sharesIssued * unitPrice;
}

export function TermsStep({
  draft,
  errors,
  onChange
}: ShareProductStepProps & {
  onChange: (patch: Partial<ShareProductTermsInput>) => void;
}) {
  const terms = draft.terms;
  const currencyCode = draft.currency.currencyCode || undefined;
  const shareCapital =
    terms.shareCapital ?? computeShareCapital(terms.sharesIssued, terms.unitPrice);

  function patchTerms(patch: Partial<ShareProductTermsInput>) {
    const next = { ...terms, ...patch };
    onChange({
      ...patch,
      shareCapital: computeShareCapital(next.sharesIssued, next.unitPrice)
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Total shares, issuance, and unit price for this product.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumericField
          id="terms.totalShares"
          label="Total number of shares"
          required
          integer
          value={String(terms.totalShares ?? '')}
          onChange={(value) =>
            patchTerms({ totalShares: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.totalShares']}
        />
        <NumericField
          id="terms.sharesIssued"
          label="Shares to be issued"
          required
          integer
          value={String(terms.sharesIssued ?? '')}
          onChange={(value) =>
            patchTerms({ sharesIssued: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.sharesIssued']}
        />
        <MoneyField
          id="terms.unitPrice"
          label="Nominal / unit price"
          required
          currencyCode={currencyCode}
          value={terms.unitPrice != null ? String(terms.unitPrice) : ''}
          onChange={(value) =>
            patchTerms({ unitPrice: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.unitPrice']}
        />
        <MoneyField
          id="terms.shareCapital"
          label="Share capital"
          optional
          disabled
          currencyCode={currencyCode}
          value={shareCapital != null ? String(shareCapital) : ''}
          onChange={() => undefined}
          hint="Calculated from shares issued × unit price."
        />
      </div>
    </div>
  );
}
