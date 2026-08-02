/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export function isValidEmail(value: string) {
  const email = value.trim();
  return Boolean(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type SendPasswordToEmailOptions = {
  /** When false, password email is unavailable (outbound email not configured). */
  smtpConfigured?: boolean;
};

/** Effective flag for create-user payload when email/SMTP allow sending. */
export function canSendPasswordToEmail(
  draft: { email: string; sendPasswordToEmail: boolean },
  options: SendPasswordToEmailOptions = {}
) {
  if (options.smtpConfigured === false) {
    return false;
  }
  return isValidEmail(draft.email) && draft.sendPasswordToEmail;
}
