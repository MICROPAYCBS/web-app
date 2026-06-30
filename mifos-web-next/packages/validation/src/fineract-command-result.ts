/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCommandProcessingResult } from '@mifos/api-client';

/** Extra fields on successful server actions when Fineract maker-checker applies. */
export type FineractCommandActionMeta = {
  /** Command was queued for checker approval; the business change is not committed yet. */
  pendingChecker?: boolean;
  /** {@code m_portfolio_command_source.id} — use for checker inbox / audit links. */
  commandId?: number;
};

export type FineractCommandActionSuccess<T extends Record<string, unknown> = Record<string, never>> =
  | ({ ok: true } & FineractCommandActionMeta & T)
  | ({ ok: true; pendingChecker: true; commandId?: number });

type RawFineractCommandProcessingResult = FineractCommandProcessingResult & {
  rollback_transaction?: boolean;
  command_id?: number;
};

function readNumber(value: unknown): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (value === true || value === false) {
    return value;
  }
  return undefined;
}

/** Normalize Fineract command API JSON (camelCase or snake_case). */
export function parseFineractCommandResult(raw: unknown): FineractCommandProcessingResult {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const row = raw as RawFineractCommandProcessingResult;
  return {
    commandId: readNumber(row.commandId ?? row.command_id),
    officeId: readNumber(row.officeId),
    groupId: readNumber(row.groupId),
    clientId: readNumber(row.clientId),
    loanId: readNumber(row.loanId),
    savingsId: readNumber(row.savingsId),
    resourceId: readNumber(row.resourceId),
    subResourceId: readNumber(row.subResourceId),
    transactionId: typeof row.transactionId === 'string' ? row.transactionId : undefined,
    productId: readNumber(row.productId),
    rollbackTransaction: readBoolean(row.rollbackTransaction ?? row.rollback_transaction),
    changes:
      row.changes && typeof row.changes === 'object' && !Array.isArray(row.changes)
        ? (row.changes as Record<string, unknown>)
        : undefined
  };
}

/** True when Fineract rolled back the business transaction pending checker approval. */
export function isPendingCheckerApproval(raw: unknown): boolean {
  return parseFineractCommandResult(raw).rollbackTransaction === true;
}

/** Primary resource id on a committed command result (not set when pending checker). */
export function readFineractCommandResourceId(
  raw: unknown
): number | undefined {
  const parsed = parseFineractCommandResult(raw);
  if (isPendingCheckerApproval(parsed)) {
    return undefined;
  }
  return (
    parsed.resourceId ??
    parsed.loanId ??
    parsed.savingsId ??
    parsed.clientId ??
    parsed.groupId
  );
}

const DEFAULT_PENDING_MESSAGE = 'Submitted for checker approval.';

/** User-facing toast or banner copy for a committed vs pending checker command. */
export function commandOutcomeMessage(
  completedMessage: string,
  options?: { pendingMessage?: string; pendingChecker?: boolean }
): string {
  if (options?.pendingChecker) {
    return options.pendingMessage ?? DEFAULT_PENDING_MESSAGE;
  }
  return completedMessage;
}

/**
 * Build a successful server-action result from a Fineract command response.
 * When maker-checker is active, entity ids are omitted and {@link pendingChecker} is set.
 */
export function actionSuccessFromFineractCommand<T extends Record<string, unknown>>(
  raw: unknown,
  fields: T = {} as T
): FineractCommandActionSuccess<T> {
  const parsed = parseFineractCommandResult(raw);
  if (isPendingCheckerApproval(parsed)) {
    return {
      ok: true,
      pendingChecker: true,
      commandId: parsed.commandId
    };
  }

  return {
    ok: true,
    ...fields
  };
}

export function isPendingCheckerActionResult(
  result: { ok: boolean; pendingChecker?: boolean }
): result is { ok: true; pendingChecker: true; commandId?: number } {
  return result.ok === true && result.pendingChecker === true;
}

/** Whether the Fineract command committed (safe to navigate to a new resource id). */
export function isFineractCommandCommitted(result: { pendingChecker?: boolean }): boolean {
  return !result.pendingChecker;
}
