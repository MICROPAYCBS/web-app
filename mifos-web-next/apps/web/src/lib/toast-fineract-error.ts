'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { toast } from 'sonner';
import { copyText } from '@/lib/clipboard';
import { splitFineractErrorMessage } from '@/lib/fineract-error-message';

/** Present a Fineract API or server-action error with copy support. */
export function toastFineractError(message: string): void {
  const text = message.trim();
  if (!text) {
    toast.error('Something went wrong.');
    return;
  }

  const { title, description } = splitFineractErrorMessage(text);

  toast.error(title, {
    description,
    action: {
      label: 'Copy',
      onClick: () => {
        void copyText(text).then((ok) => {
          if (ok) {
            toast.success('Copied to clipboard.');
            return;
          }
          toast.error('Could not copy to clipboard.');
        });
      }
    }
  });
}

/** Fineract action failure with optional field-level messages folded into the toast body. */
export function toastActionError(
  message: string,
  fieldErrors?: Record<string, string>
): void {
  toastFineractError(formatActionErrorMessage(message, fieldErrors));
}

/** @deprecated Use {@link toastFineractError}. */
export const toastCopyableError = toastFineractError;
