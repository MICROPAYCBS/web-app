/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Fineract userMessageGlobalisationCode → human-readable message.
 * Extend from reference web-app translations and Fineract properties files.
 */
const ERROR_MESSAGES: Record<string, string> = {
  'error.msg.data.integrity.issue': 'A data integrity issue occurred.',
  'error.msg.data.integrity.issue.entity.duplicated': 'This record already exists.',
  'validation.msg.validation.errors.exist': 'Please correct the validation errors.'
};

export function translateFineractCode(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? code;
}
