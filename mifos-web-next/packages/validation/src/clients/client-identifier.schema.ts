/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const clientIdentifierSchema = z.object({
  documentTypeId: z.number().int().positive(),
  status: z.enum(['Active', 'Inactive']),
  documentKey: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional()
});

export type ClientIdentifierInput = z.infer<typeof clientIdentifierSchema>;

export type ClientIdentifierIdentityTypeOption = {
  codeValueId: number;
  codeValueName?: string;
  example?: string;
  formatDescription?: string;
  validationMessage?: string;
  validationRegex?: string;
  status?: string;
};

export type ClientIdentifierValidationContext = {
  /** Active rules from GET /clients/{id}/identifiers/template */
  identityTypeOptions?: ClientIdentifierIdentityTypeOption[];
};

export function findIdentityTypeRule(
  documentTypeId: number,
  identityTypeOptions: ClientIdentifierIdentityTypeOption[] | undefined
): ClientIdentifierIdentityTypeOption | undefined {
  return identityTypeOptions?.find(
    (option) => option.codeValueId === documentTypeId && option.status !== 'INACTIVE'
  );
}

export function validateDocumentKeyAgainstIdentityRule(
  documentKey: string,
  rule: ClientIdentifierIdentityTypeOption | undefined
): string | null {
  if (!rule?.validationRegex?.trim()) {
    return null;
  }
  try {
    if (!new RegExp(rule.validationRegex).test(documentKey.trim())) {
      return (
        rule.validationMessage?.trim() ||
        rule.example?.trim() ||
        rule.formatDescription?.trim() ||
        `Document number does not match the required format${rule.codeValueName ? ` for ${rule.codeValueName}` : ''}.`
      );
    }
    return null;
  } catch {
    return 'Identity type guide validation regex is invalid.';
  }
}

export function validateClientIdentifier(
  input: unknown,
  context: ClientIdentifierValidationContext = {}
) {
  const parsed = clientIdentifierSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }

  const rule = findIdentityTypeRule(parsed.data.documentTypeId, context.identityTypeOptions);
  const regexError = validateDocumentKeyAgainstIdentityRule(parsed.data.documentKey, rule);

  if (regexError) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: regexError,
          path: ['documentKey']
        }
      ])
    };
  }

  return {
    success: true as const,
    data: {
      ...parsed.data,
      documentKey: parsed.data.documentKey.trim()
    }
  };
}
