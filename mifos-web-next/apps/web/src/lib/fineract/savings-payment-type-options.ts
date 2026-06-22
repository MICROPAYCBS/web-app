/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type SavingsPaymentTypeOption = {
  id: number;
  name: string;
  isSystemDefined?: boolean;
};

export function resolvePaymentTypeId(
  ...candidates: (number | string | null | undefined)[]
): number | undefined {
  for (const value of candidates) {
    if (value == null || value === '') {
      continue;
    }
    const id = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(id) && id > 0) {
      return id;
    }
  }
  return undefined;
}

/** Non-system payment types offered on new deposit/withdrawal forms. */
export function userSelectablePaymentTypeOptions(
  options: SavingsPaymentTypeOption[]
): { id: number; name: string }[] {
  return options
    .filter((option) => option.isSystemDefined !== true)
    .map((option) => ({ id: option.id, name: option.name }));
}

/** Keeps the transaction's current payment type selectable even when system-defined. */
export function paymentTypeOptionsIncludingSelected(
  options: SavingsPaymentTypeOption[],
  selectedPaymentTypeId?: number,
  selectedPaymentTypeName?: string
): { id: number; name: string }[] {
  const selectable = userSelectablePaymentTypeOptions(options);
  if (selectedPaymentTypeId == null) {
    return selectable;
  }
  if (selectable.some((row) => row.id === selectedPaymentTypeId)) {
    return selectable;
  }
  const fromTemplate = options.find((row) => row.id === selectedPaymentTypeId);
  const name = fromTemplate?.name ?? selectedPaymentTypeName?.trim();
  if (!name) {
    return selectable;
  }
  return [{ id: selectedPaymentTypeId, name }, ...selectable];
}
