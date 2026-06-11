/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractEnumOption,
  StandingInstructionAccountRef,
  StandingInstructionClientRef
} from '@mifos/api-client';
import { formatAmount, toDecimal } from '@mifos/domain';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export function standingInstructionEnumLabel(option?: FineractEnumOption): string {
  if (!option) {
    return '—';
  }
  return option.value ?? option.name ?? option.code ?? String(option.id);
}

export function standingInstructionValidityLabel(
  validFrom?: number[] | string,
  validTill?: number[] | string
): string {
  const from =
    typeof validFrom === 'string'
      ? validFrom
      : formatFineractDateArray(validFrom) ?? '—';
  const till =
    typeof validTill === 'string'
      ? validTill
      : formatFineractDateArray(validTill) ?? '—';
  return `${from} to ${till}`;
}

export function standingInstructionClientLabel(client?: StandingInstructionClientRef): string {
  if (!client) {
    return '—';
  }
  const name = client.displayName?.trim();
  if (name) {
    return `${name} (${client.id})`;
  }
  return String(client.id);
}

export function standingInstructionAccountLabel(account?: StandingInstructionAccountRef): string {
  if (!account) {
    return '—';
  }
  const label = account.productName?.trim() || account.accountNo?.trim();
  if (label) {
    return `${label} (${account.id})`;
  }
  return String(account.id);
}

export function standingInstructionRunAmountLabel(amount?: number): string {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }
  const decimal = toDecimal(amount);
  if (!decimal) {
    return '—';
  }
  return formatAmount(decimal);
}
