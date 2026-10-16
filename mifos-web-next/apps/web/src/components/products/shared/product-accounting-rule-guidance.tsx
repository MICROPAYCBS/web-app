/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  depositAccountingRuleGuidance,
  type DepositAccountingProduct
} from '@/lib/fineract/deposit-accounting-rule-guidance';

export function ProductAccountingRuleGuidance({
  product,
  ruleId
}: {
  product: DepositAccountingProduct;
  ruleId: number | undefined;
}) {
  const guidance = depositAccountingRuleGuidance(product, ruleId);
  if (!guidance) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">{guidance.title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
        {guidance.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}
