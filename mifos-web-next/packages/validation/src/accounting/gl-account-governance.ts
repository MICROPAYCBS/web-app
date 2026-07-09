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

export function glAccountParentTypeMatches(parentTypeId: number | undefined, typeId: number): boolean {
  if (parentTypeId == null) {
    return true;
  }
  return parentTypeId === typeId;
}
