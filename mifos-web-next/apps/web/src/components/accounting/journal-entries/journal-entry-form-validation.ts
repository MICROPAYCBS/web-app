/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  validateCreateJournalEntryForm,
  type CreateJournalEntryFormInput,
  type CreateJournalEntryValidationContext
} from '@mifos/validation';

export type JournalEntryFormErrors = Record<string, string>;

export function validateJournalEntryForm(
  form: CreateJournalEntryFormInput,
  context: CreateJournalEntryValidationContext
): JournalEntryFormErrors {
  const parsed = validateCreateJournalEntryForm(form, context);
  if (parsed.success) {
    return {};
  }
  const errors: JournalEntryFormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.map(String).join('.') || 'form';
    errors[key] = issue.message;
  }
  return errors;
}
