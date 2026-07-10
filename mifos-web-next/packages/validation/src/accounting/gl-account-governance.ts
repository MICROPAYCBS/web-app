/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fineract GL account classification enum ids. */
export const GL_ACCOUNT_TYPE_ASSET = 1;
export const GL_ACCOUNT_TYPE_LIABILITY = 2;
export const GL_ACCOUNT_TYPE_EQUITY = 3;
export const GL_ACCOUNT_TYPE_INCOME = 4;
export const GL_ACCOUNT_TYPE_EXPENSE = 5;

export const GL_ACCOUNT_CODE_CLASS_PREFIX: Record<number, string> = {
  [GL_ACCOUNT_TYPE_ASSET]: '1',
  [GL_ACCOUNT_TYPE_LIABILITY]: '2',
  [GL_ACCOUNT_TYPE_EQUITY]: '3',
  [GL_ACCOUNT_TYPE_INCOME]: '4',
  [GL_ACCOUNT_TYPE_EXPENSE]: '5'
};

const GL_ACCOUNT_TYPE_LABELS: Record<number, string> = {
  [GL_ACCOUNT_TYPE_ASSET]: 'Asset',
  [GL_ACCOUNT_TYPE_LIABILITY]: 'Liability',
  [GL_ACCOUNT_TYPE_EQUITY]: 'Equity',
  [GL_ACCOUNT_TYPE_INCOME]: 'Income',
  [GL_ACCOUNT_TYPE_EXPENSE]: 'Expense'
};

export function glAccountTypeLabel(typeId: number): string {
  return GL_ACCOUNT_TYPE_LABELS[typeId] ?? 'Account';
}

function structuredGlCodeExample(prefix: string, codeLength: number): string {
  return `${prefix}${'0'.repeat(Math.max(codeLength - 1, 0))}`;
}

export function glAccountCodeTypePrefixError(typeId: number, codeLength = 6): string {
  const prefix = GL_ACCOUNT_CODE_CLASS_PREFIX[typeId];
  const label = glAccountTypeLabel(typeId);
  if (!prefix) {
    return 'GL code must start with the digit for the selected account class.';
  }
  return `${label} accounts must start with ${prefix} (for example, ${structuredGlCodeExample(prefix, codeLength)}).`;
}

export function glAccountCodeLengthError(glCode: string, codeLength: number): string {
  const trimmed = glCode.trim();
  if (trimmed && !/^\d+$/.test(trimmed)) {
    return 'GL code must contain digits only.';
  }
  if (trimmed.length > 0 && trimmed.length !== codeLength) {
    return `GL code must be exactly ${codeLength} digits (you entered ${trimmed.length}).`;
  }
  return `GL code must be exactly ${codeLength} digits.`;
}

export function glAccountCodeHeaderStemError(
  glCode: string,
  parentGlCode: string,
  codeLength = 6
): string {
  const headerStem = deriveGlAccountHeaderStem(parentGlCode);
  const suffixLength = Math.max(codeLength - headerStem.length, 0);
  const example =
    suffixLength > 0
      ? `${headerStem}${'0'.repeat(Math.max(suffixLength - 1, 0))}1`
      : `${headerStem}1`;

  if (glCode.trim() === parentGlCode.trim()) {
    return `GL code cannot match the parent header (${parentGlCode}). Use a ${codeLength}-digit code starting with ${headerStem} (for example, ${example}).`;
  }

  return `GL code must start with ${headerStem} under parent ${parentGlCode} (for example, ${example}).`;
}

export function glAccountParentTypeError(typeId: number): string {
  return `Choose a parent ${glAccountTypeLabel(typeId)} header account.`;
}

export function glAccountStatementTagError(typeId: number): string {
  if (typeId === GL_ACCOUNT_TYPE_INCOME) {
    return 'Select a statement line tag for income accounts.';
  }
  if (typeId === GL_ACCOUNT_TYPE_EXPENSE) {
    return 'Select a statement line tag for expense accounts.';
  }
  return 'Select a statement line tag for income and expense accounts.';
}

export function glAccountRequiresStatementTag(typeId: number): boolean {
  return typeId === GL_ACCOUNT_TYPE_INCOME || typeId === GL_ACCOUNT_TYPE_EXPENSE;
}

export function glAccountCodeMatchesTypePrefix(glCode: string, typeId: number): boolean {
  const prefix = GL_ACCOUNT_CODE_CLASS_PREFIX[typeId];
  const trimmed = glCode.trim();
  if (!prefix || !trimmed) {
    return true;
  }
  return trimmed.startsWith(prefix);
}

export function glAccountCodeMatchesStructuredLength(glCode: string, length: number): boolean {
  const trimmed = glCode.trim();
  if (!trimmed || !Number.isFinite(length) || length <= 0) {
    return true;
  }
  return trimmed.length === length && /^\d+$/.test(trimmed);
}

export function deriveGlAccountHeaderStem(parentGlCode: string): string {
  const normalized = parentGlCode.trim();
  if (!normalized) {
    return normalized;
  }
  let lastNonZeroIndex = -1;
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    if (normalized.charAt(index) !== '0') {
      lastNonZeroIndex = index;
      break;
    }
  }
  if (lastNonZeroIndex <= 0) {
    return normalized.slice(0, 1);
  }
  let trailingZeros = 0;
  for (let index = normalized.length - 1; index >= 0 && normalized.charAt(index) === '0'; index -= 1) {
    trailingZeros += 1;
  }
  const stemEnd = trailingZeros >= 3 ? normalized.length - 3 : normalized.length - trailingZeros;
  return normalized.slice(0, Math.max(stemEnd, 1));
}

export function glAccountCodeMatchesHeaderStem(
  glCode: string,
  parentGlCode: string | undefined
): boolean {
  if (!parentGlCode?.trim()) {
    return true;
  }
  const normalizedChild = glCode.trim();
  const normalizedParent = parentGlCode.trim();
  if (!normalizedChild) {
    return true;
  }
  const headerStem = deriveGlAccountHeaderStem(normalizedParent);
  return normalizedChild !== normalizedParent && normalizedChild.startsWith(headerStem);
}

export function glAccountParentTypeMatches(parentTypeId: number | undefined, typeId: number): boolean {
  if (parentTypeId == null) {
    return true;
  }
  return parentTypeId === typeId;
}

export type GlAccountStructuredSnapshot = {
  glCode: string;
  type: number;
  parentId?: number;
};

/** True when structured GL code rules should run (create, or edit after code/type/parent changed). */
export function glAccountStructuredValidationApplies(
  current: GlAccountStructuredSnapshot,
  original?: GlAccountStructuredSnapshot
): boolean {
  if (!original) {
    return true;
  }
  return (
    current.glCode.trim() !== original.glCode.trim() ||
    current.type !== original.type ||
    current.parentId !== original.parentId
  );
}

export function glAccountCodeMeetsStructuredRules(
  glCode: string,
  typeId: number,
  options: { codeLength: number; parentGlCode?: string }
): boolean {
  const codeLength = options.codeLength;
  return (
    glAccountCodeMatchesTypePrefix(glCode, typeId) &&
    glAccountCodeMatchesStructuredLength(glCode, codeLength) &&
    glAccountCodeMatchesHeaderStem(glCode, options.parentGlCode)
  );
}

/** Strip non-digits and cap length for structured GL code entry. */
export function normalizeStructuredGlCodeInput(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, Math.max(maxLength, 0));
}

export const GL_ACCOUNT_STRUCTURED_GL_CODE_ERROR_CODES = new Set([
  'error.msg.glaccount.glcode.invalid.format',
  'error.msg.glaccount.glcode.category.mismatch',
  'error.msg.glaccount.glcode.header.mismatch'
]);
