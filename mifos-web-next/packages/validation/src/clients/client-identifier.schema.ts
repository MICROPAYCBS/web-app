/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/** Schema fallback when an identity type has no parseable length limit. */
export const CLIENT_IDENTIFIER_DOCUMENT_KEY_MAX_LENGTH = 100;

export const clientIdentifierSchema = z.object({
  documentTypeId: z.number().int().positive(),
  status: z.enum(['Active', 'Inactive']),
  documentKey: z.string().trim().min(1).max(CLIENT_IDENTIFIER_DOCUMENT_KEY_MAX_LENGTH),
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

export function countValidClientIdentifiers(
  identifiers: ClientIdentifierInput[] | undefined
): number {
  if (!identifiers?.length) {
    return 0;
  }
  return identifiers.filter(
    (identifier) =>
      identifier.documentTypeId > 0 && identifier.documentKey.trim().length > 0
  ).length;
}

export const CLIENT_IDENTIFIERS_REQUIRED_MESSAGE =
  'At least one identification document is required for individual customers.';

export function findIdentityTypeRule(
  documentTypeId: number,
  identityTypeOptions: ClientIdentifierIdentityTypeOption[] | undefined
): ClientIdentifierIdentityTypeOption | undefined {
  return identityTypeOptions?.find(
    (option) => option.codeValueId === documentTypeId && option.status !== 'INACTIVE'
  );
}

/**
 * Best-effort max match length for an anchored validation regex
 * (e.g. `^[A-Za-z]{2}[A-Za-z0-9]{14}$` → 16). Returns undefined when the
 * pattern is open-ended, uses alternation/groups, or is otherwise unsupported.
 */
export function maxLengthFromValidationRegex(
  pattern: string | undefined | null
): number | undefined {
  const raw = pattern?.trim();
  if (!raw) {
    return undefined;
  }

  let source = raw;
  if (source.startsWith('/') && source.lastIndexOf('/') > 0) {
    source = source.slice(1, source.lastIndexOf('/'));
  }
  if (!source.startsWith('^') || !source.endsWith('$')) {
    return undefined;
  }

  let i = 1;
  const end = source.length - 1;
  let max = 0;

  while (i < end) {
    let atomMax = 1;

    if (source[i] === '\\') {
      if (i + 1 >= end) {
        return undefined;
      }
      i += 2;
    } else if (source[i] === '[') {
      const close = findCharacterClassEnd(source, i, end);
      if (close < 0) {
        return undefined;
      }
      i = close + 1;
    } else if (source[i] === '(' || source[i] === '|' || source[i] === '^' || source[i] === '$') {
      return undefined;
    } else if (source[i] === '.' || source[i] === ']') {
      i += 1;
    } else {
      i += 1;
    }

    if (i >= end) {
      max += atomMax;
      break;
    }

    const quantifier = source[i];
    if (quantifier === '{') {
      const close = source.indexOf('}', i);
      if (close < 0 || close >= end) {
        return undefined;
      }
      const body = source.slice(i + 1, close);
      const parts = body.split(',');
      if (parts.length === 1) {
        const n = Number(parts[0]);
        if (!Number.isInteger(n) || n < 0) {
          return undefined;
        }
        max += atomMax * n;
      } else if (parts.length === 2) {
        if (parts[1] === '') {
          return undefined;
        }
        const upper = Number(parts[1]);
        if (!Number.isInteger(upper) || upper < 0) {
          return undefined;
        }
        max += atomMax * upper;
      } else {
        return undefined;
      }
      i = close + 1;
      continue;
    }
    if (quantifier === '?') {
      max += atomMax;
      i += 1;
      continue;
    }
    if (quantifier === '+' || quantifier === '*') {
      return undefined;
    }

    max += atomMax;
  }

  return max > 0 ? max : undefined;
}

function findCharacterClassEnd(source: string, start: number, end: number): number {
  let i = start + 1;
  if (i < end && source[i] === '^') {
    i += 1;
  }
  if (i < end && source[i] === ']') {
    i += 1;
  }
  while (i < end) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === ']') {
      return i;
    }
    i += 1;
  }
  return -1;
}

/** Input max length for a selected identity type rule (capped by schema). */
export function documentKeyMaxLengthForIdentityRule(
  rule: ClientIdentifierIdentityTypeOption | undefined
): number {
  const fromRegex = maxLengthFromValidationRegex(rule?.validationRegex);
  if (fromRegex == null) {
    return CLIENT_IDENTIFIER_DOCUMENT_KEY_MAX_LENGTH;
  }
  return Math.min(fromRegex, CLIENT_IDENTIFIER_DOCUMENT_KEY_MAX_LENGTH);
}

export function clampDocumentKeyInput(value: string, maxLength: number): string {
  const limit = Math.max(0, maxLength);
  return value.length <= limit ? value : value.slice(0, limit);
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
