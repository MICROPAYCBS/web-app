/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import {
  isValidUgandaNin,
  normalizeUgandaNin,
  UGANDA_NIN_MESSAGE,
  UGANDA_NIN_PLACEHOLDER
} from '../uganda-nin';

/** @deprecated Use {@link UGANDA_NIN_PATTERN} via {@link isValidUgandaNin}. */
export const FIRST_IDENTIFIER_DOCUMENT_KEY_PATTERN = /^[A-Z0-9]{14}$/;

export const FIRST_IDENTIFIER_DOCUMENT_KEY_MESSAGE = UGANDA_NIN_MESSAGE;

/** Example format shown when the first identifier type is selected. */
export const FIRST_IDENTIFIER_DOCUMENT_KEY_PLACEHOLDER = UGANDA_NIN_PLACEHOLDER;

export const clientIdentifierSchema = z.object({
  documentTypeId: z.number().int().positive(),
  status: z.enum(['Active', 'Inactive']),
  documentKey: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional()
});

export type ClientIdentifierInput = z.infer<typeof clientIdentifierSchema>;

export type ClientIdentifierValidationContext = {
  /** `allowedDocumentTypes[0].id` from GET /clients/{id}/identifiers/template */
  firstDocumentTypeId?: number;
};

export function isFirstIdentifierDocumentType(
  documentTypeId: number,
  firstDocumentTypeId: number | undefined
): boolean {
  return firstDocumentTypeId != null && documentTypeId === firstDocumentTypeId;
}

export function validateFirstIdentifierDocumentKey(documentKey: string): boolean {
  return isValidUgandaNin(documentKey);
}

export function validateClientIdentifier(
  input: unknown,
  context: ClientIdentifierValidationContext = {}
) {
  const parsed = clientIdentifierSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }

  const { documentTypeId, documentKey } = parsed.data;
  if (
    isFirstIdentifierDocumentType(documentTypeId, context.firstDocumentTypeId) &&
    !validateFirstIdentifierDocumentKey(documentKey)
  ) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: FIRST_IDENTIFIER_DOCUMENT_KEY_MESSAGE,
          path: ['documentKey']
        }
      ])
    };
  }

  const normalizedKey = isFirstIdentifierDocumentType(documentTypeId, context.firstDocumentTypeId)
    ? normalizeUgandaNin(documentKey)
    : documentKey.trim();

  return {
    success: true as const,
    data: {
      ...parsed.data,
      documentKey: normalizedKey
    }
  };
}
