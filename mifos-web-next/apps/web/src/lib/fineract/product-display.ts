/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption, ProductGlAccountRef } from '@mifos/api-client';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';

/** Display label for a GL account reference from product detail. */
export function glAccountLabel(account?: ProductGlAccountRef): string {
  if (!account) {
    return '—';
  }
  const code = account.glCode?.trim();
  const name = account.name?.trim();
  if (code && name) {
    return `${code} — ${name}`;
  }
  return code ?? name ?? '—';
}

export function accountingRuleLabel(rule?: FineractEnumOption): string {
  const label = enumOptionLabel(rule);
  if (label) {
    return label;
  }
  if (rule?.code) {
    return rule.code.replace(/_/g, ' ');
  }
  return '—';
}

/** Accounting rule id 1 = None (Fineract convention). */
export function isProductAccountingEnabled(rule?: FineractEnumOption): boolean {
  if (!rule) {
    return false;
  }
  if (rule.id === 1) {
    return false;
  }
  const code = rule.code?.toLowerCase() ?? '';
  return code !== 'none' && code !== 'accountingtype.none';
}
