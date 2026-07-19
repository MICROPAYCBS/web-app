'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { notifyCheckerInboxPendingChanged } from '@/lib/checker-inbox/pending-count';
import { toastActionError, toastFineractError } from '@/lib/toast-fineract-error';
import { commandOutcomeMessage, type FineractCommandActionMeta } from '@mifos/validation';
import { toast } from 'sonner';

export { toastActionError, toastFineractError };

export type CommandOutcomeToastMessages = {
  /** Shown when the Fineract command committed immediately. */
  completed: string;
  /** Shown when maker-checker queued the command (defaults in validation). */
  pending?: string;
};

type MutationResult = {
  ok: boolean;
  pendingChecker?: boolean;
};

export type MutationActionSuccess = { ok: true } & FineractCommandActionMeta;

/**
 * Show a success toast that reflects whether a mutation committed or is pending checker approval.
 * Returns true when {@link result.ok}; false when the caller should surface an error instead.
 */
export function toastCommandOutcome(
  result: MutationResult,
  messages: CommandOutcomeToastMessages
): result is MutationActionSuccess {
  if (!result.ok) {
    return false;
  }

  toast.success(
    commandOutcomeMessage(messages.completed, {
      pendingChecker: result.pendingChecker,
      pendingMessage: messages.pending
    })
  );
  if (result.pendingChecker) {
    notifyCheckerInboxPendingChanged();
  }
  return true;
}

/** Present a failed server-action / Fineract mutation result. */
export function toastCommandFailure(result: {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string>;
}): void {
  toastActionError(result.message, result.fieldErrors);
}
