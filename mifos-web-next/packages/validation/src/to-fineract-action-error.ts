/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';
import { getFineractErrorMessage } from '@mifos/i18n';
import { mapFineractErrors } from './map-fineract-errors';

export type FineractActionError = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string>;
};

/** Map a caught error to a server-action failure result with Fineract messages preserved. */
export function toFineractActionError(err: unknown, fallback: string): FineractActionError {
  if (err instanceof FineractHttpError) {
    const mapped = mapFineractErrors(err.body);
    const fieldErrors = Object.fromEntries(mapped.fieldErrors.map((e) => [e.field, e.message]));
    const message =
      mapped.globalMessage ?? getFineractErrorMessage(err.body, err.status) ?? err.message;

    return {
      ok: false,
      message,
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined
    };
  }

  return {
    ok: false,
    message: err instanceof Error ? err.message : fallback
  };
}

const ACTION_ERROR_FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  username: 'Login name',
  firstname: 'First name',
  lastname: 'Last name',
  officeId: 'Branch',
  staffId: 'Staff',
  roles: 'Roles',
  password: 'Password',
  repeatPassword: 'Confirm password'
};

function fieldLabel(field: string): string {
  return ACTION_ERROR_FIELD_LABELS[field] ?? field;
}

/** Expand bare field keys / one-word stubs into a readable sentence. */
function humanizeActionFieldError(field: string, fieldMessage: string): string {
  const trimmed = fieldMessage.trim();
  const label = fieldLabel(field);
  if (!trimmed || trimmed.toLowerCase() === field.toLowerCase()) {
    return `${label} needs attention. Go back and check this field.`;
  }
  if (trimmed.toLowerCase() === label.toLowerCase()) {
    return `${label} needs attention. Go back and check this field.`;
  }
  // Avoid treating short tokens (e.g. "email") as already covered by a longer message.
  if (trimmed.split(/\s+/).length <= 2 && !/[.!?]/.test(trimmed)) {
    return `${label}: ${trimmed}`;
  }
  if (!trimmed.toLowerCase().includes(label.toLowerCase()) && !trimmed.toLowerCase().includes(field.toLowerCase())) {
    return `${label}: ${trimmed}`;
  }
  return trimmed;
}

/** Combine global and field messages for inline UI display. */
export function formatActionErrorMessage(
  message: string,
  fieldErrors?: Record<string, string>
): string {
  const trimmedMessage = message.trim();
  if (!fieldErrors || !Object.keys(fieldErrors).length) {
    if (
      trimmedMessage &&
      /^[a-z][a-zA-Z0-9_]*$/.test(trimmedMessage) &&
      ACTION_ERROR_FIELD_LABELS[trimmedMessage]
    ) {
      return humanizeActionFieldError(trimmedMessage, trimmedMessage);
    }
    return message;
  }

  const fieldParts = Object.entries(fieldErrors).map(([field, fieldMessage]) =>
    humanizeActionFieldError(field, fieldMessage)
  );

  const messageLooksLikeBareField =
    Boolean(trimmedMessage) &&
    /^[a-z][a-zA-Z0-9_]*$/.test(trimmedMessage) &&
    Object.prototype.hasOwnProperty.call(fieldErrors, trimmedMessage);

  // Generic “fix fields” banners are only useful when paired with the field sentences.
  const messageIsGenericFixPrompt =
    trimmedMessage === 'Fix the highlighted fields.' ||
    trimmedMessage === 'Please fix the highlighted fields before creating this user.' ||
    trimmedMessage === 'Please fix the highlighted fields.';

  const normalizedGlobal = trimmedMessage.toLowerCase();
  const dedupedFieldParts = fieldParts.filter((part) => {
    const normalizedPart = part.toLowerCase();
    if (!trimmedMessage) {
      return true;
    }
    // Avoid "Message. field: Message" when global + field carry the same copy.
    if (normalizedPart === normalizedGlobal) {
      return false;
    }
    if (normalizedPart.endsWith(`: ${normalizedGlobal}`)) {
      return false;
    }
    if (normalizedGlobal.includes(normalizedPart)) {
      return false;
    }
    return true;
  });

  const uniqueParts = [
    ...new Set(
      [
        messageLooksLikeBareField || messageIsGenericFixPrompt ? null : trimmedMessage,
        ...dedupedFieldParts
      ].filter((part): part is string => Boolean(part))
    )
  ];
  return uniqueParts.length > 0
    ? uniqueParts.join('\n')
    : trimmedMessage || 'Please fix the highlighted fields.';
}
