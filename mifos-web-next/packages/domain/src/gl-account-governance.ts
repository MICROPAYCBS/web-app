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

export function glAccountTypeRequiresStatementTag(typeId: number): boolean {
  return typeId === GL_ACCOUNT_TYPE_INCOME || typeId === GL_ACCOUNT_TYPE_EXPENSE;
}

export function glAccountCodeMatchesTypePrefix(glCode: string, typeId: number): boolean {
  const prefix = GL_ACCOUNT_CODE_CLASS_PREFIX[typeId];
  if (!prefix) {
    return true;
  }
  const trimmed = glCode.trim();
  return trimmed.length > 0 && trimmed.startsWith(prefix);
}

export function glAccountParentTypeMatches(typeId: number, parentTypeId: number | undefined): boolean {
  if (parentTypeId == null) {
    return true;
  }
  return typeId === parentTypeId;
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
