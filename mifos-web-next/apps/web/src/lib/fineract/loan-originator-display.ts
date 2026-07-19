/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanOriginatorListItem } from '@mifos/api-client';

export function formatLoanOriginatorStatus(status: string | undefined): string {
  if (!status) {
    return '—';
  }
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function loanOriginatorStatusVariant(
  status: string | undefined
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'INACTIVE':
      return 'outline';
    default:
      return 'secondary';
  }
}

export function normalizeLoanOriginatorListItem(raw: unknown): LoanOriginatorListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const externalId = typeof row.externalId === 'string' ? row.externalId : '';
  const status = typeof row.status === 'string' ? row.status : '';

  if (!Number.isFinite(id) || !name) {
    return null;
  }

  function normalizeCodeValue(value: unknown) {
    if (!value || typeof value !== 'object') {
      return undefined;
    }
    const code = value as Record<string, unknown>;
    const codeId = Number(code.id);
    const codeName = typeof code.name === 'string' ? code.name : '';
    if (!Number.isFinite(codeId) || !codeName) {
      return undefined;
    }
    return { id: codeId, name: codeName };
  }

  return {
    id,
    name,
    externalId,
    status,
    originatorType: normalizeCodeValue(row.originatorType),
    channelType: normalizeCodeValue(row.channelType)
  };
}
