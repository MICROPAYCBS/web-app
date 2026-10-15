/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  actionSuccessFromFineractCommand,
  parseFineractCommandResult,
  type FineractCommandActionMeta
} from '@mifos/validation';

export const LOAN_NPA_REASON_CODE_NAME = 'LoanNPAReasons';

export interface LoanNpaReasonOption {
  id: number;
  name: string;
}

function blankToUndefined(raw: unknown): string | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
}

/** Reason label from a string or a code-value object. Ids are not shown. */
export function loanNpaReasonName(raw: unknown): string | undefined {
  if (typeof raw === 'string') {
    return blankToUndefined(raw);
  }
  if (raw && typeof raw === 'object' && 'name' in raw) {
    return blankToUndefined((raw as { name?: unknown }).name);
  }
  return undefined;
}

export function loanNpaReasonNote(raw: unknown): string | undefined {
  return blankToUndefined(raw);
}

/** Keep active code values and order them by position. */
export function activeLoanNpaReasons(raw: unknown): LoanNpaReasonOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const reasons: { id: number; name: string; position: number }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    if (row.active !== true) {
      continue;
    }
    const id = Number(row.id);
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!Number.isFinite(id) || id <= 0 || !name) {
      continue;
    }
    const position = Number(row.position);
    reasons.push({
      id,
      name,
      position: Number.isFinite(position) ? position : Number.MAX_SAFE_INTEGER
    });
  }

  reasons.sort((left, right) => left.position - right.position || left.name.localeCompare(right.name));
  return reasons.map(({ id, name }) => ({ id, name }));
}

export type LoanNpaCommandSuccess = { ok: true; resourceId?: number } & FineractCommandActionMeta;

/**
 * `loanId` means the command was applied. `commandId` without `loanId` is awaiting approval.
 */
export function loanNpaCommandSuccess(raw: unknown): LoanNpaCommandSuccess {
  const parsed = parseFineractCommandResult(raw);
  if (parsed.loanId != null) {
    return { ok: true, resourceId: parsed.loanId };
  }
  if (parsed.commandId != null) {
    return { ok: true, pendingChecker: true, commandId: parsed.commandId };
  }
  return actionSuccessFromFineractCommand(raw);
}
