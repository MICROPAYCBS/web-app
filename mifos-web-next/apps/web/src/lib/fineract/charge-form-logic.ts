/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeTemplate, FineractEnumOption } from '@mifos/api-client';
import { formatChargeMonthDay, isChargeTiersAllowed, parseChargeMonthDay } from '@mifos/validation';

export const CHARGE_APPLIES_TO = {
  LOAN: 1,
  SAVINGS: 2,
  CLIENT: 3,
  SHARES: 4,
  WORKING_CAPITAL: 5
} as const;

export { isChargeTiersAllowed };

/** Client-level charges are not offered in the create wizard. */
export function chargeAppliesToOptionsForWizard(
  mode: 'create' | 'edit',
  options: FineractEnumOption[] | undefined
): FineractEnumOption[] {
  const list = options ?? [];
  if (mode === 'create') {
    return list.filter((option) => option.id !== CHARGE_APPLIES_TO.CLIENT);
  }
  return list;
}

export function chargeTimeTypeOptions(
  template: ChargeTemplate,
  chargeAppliesTo?: number,
  selectedTimeType?: number
): FineractEnumOption[] {
  switch (chargeAppliesTo) {
    case CHARGE_APPLIES_TO.LOAN:
      return template.loanChargeTimeTypeOptions ?? [];
    case CHARGE_APPLIES_TO.SAVINGS:
      return (template.savingsChargeTimeTypeOptions ?? []).filter(
        (option) => option.id !== 4 || option.id === selectedTimeType
      );
    case CHARGE_APPLIES_TO.CLIENT:
      return template.clientChargeTimeTypeOptions ?? [];
    case CHARGE_APPLIES_TO.SHARES:
      return template.shareChargeTimeTypeOptions ?? [];
    case CHARGE_APPLIES_TO.WORKING_CAPITAL: {
      const source = template.workingCapitalChargeTimeTypeOptions?.length
        ? template.workingCapitalChargeTimeTypeOptions
        : (template.loanChargeTimeTypeOptions ?? []);
      return source.filter((option) => option.id === 2);
    }
    default:
      return [];
  }
}

/** Period frequency 0–3. Whole term (4) is on the template list and is rejected by charge validation. */
const FEE_PERIOD_FALLBACK: FineractEnumOption[] = [
  { id: 0, name: 'Days' },
  { id: 1, name: 'Weeks' },
  { id: 2, name: 'Months' },
  { id: 3, name: 'Years' }
];

export function feePeriodOptions(template: ChargeTemplate): FineractEnumOption[] {
  const filtered = (template.feeFrequencyOptions ?? []).filter(
    (option) => option.id != null && option.id >= 0 && option.id <= 3
  );
  return filtered.length > 0 ? filtered : FEE_PERIOD_FALLBACK;
}

export function chargeCalculationTypeOptions(
  template: ChargeTemplate,
  chargeAppliesTo?: number
): FineractEnumOption[] {
  switch (chargeAppliesTo) {
    case CHARGE_APPLIES_TO.LOAN:
      return template.loanChargeCalculationTypeOptions ?? [];
    case CHARGE_APPLIES_TO.SAVINGS:
      return template.savingsChargeCalculationTypeOptions ?? [];
    case CHARGE_APPLIES_TO.CLIENT:
      return template.clientChargeCalculationTypeOptions ?? [];
    case CHARGE_APPLIES_TO.SHARES:
      return template.shareChargeCalculationTypeOptions ?? [];
    case CHARGE_APPLIES_TO.WORKING_CAPITAL: {
      const source = template.workingCapitalChargeCalculationTypeOptions?.length
        ? template.workingCapitalChargeCalculationTypeOptions
        : (template.loanChargeCalculationTypeOptions ?? []);
      return source.filter((option) => option.id === 1);
    }
    default:
      return [];
  }
}

export function filteredChargeCalculationTypeOptions(
  template: ChargeTemplate,
  chargeAppliesTo?: number,
  chargeTimeType?: number
): FineractEnumOption[] {
  return chargeCalculationTypeOptions(template, chargeAppliesTo).filter((option) => {
    const id = option.id;
    if (id == null) {
      return false;
    }
    if (chargeAppliesTo === CHARGE_APPLIES_TO.LOAN) {
      if (chargeTimeType === 12) {
        return id === 1 || id === 5;
      }
      return id >= 1 && id <= 4;
    }
    if (chargeAppliesTo === CHARGE_APPLIES_TO.SAVINGS) {
      if (id === 1) {
        return true;
      }
      return id === 2 && (chargeTimeType === 5 || chargeTimeType === 16);
    }
    if (chargeAppliesTo === CHARGE_APPLIES_TO.CLIENT || chargeAppliesTo === CHARGE_APPLIES_TO.WORKING_CAPITAL) {
      return id === 1;
    }
    if (chargeAppliesTo === CHARGE_APPLIES_TO.SHARES) {
      if (chargeTimeType === 13) {
        return id === 1;
      }
      return id === 1 || id === 2;
    }
    return true;
  });
}

export function chargePaymentModeOptions(
  template: ChargeTemplate,
  chargeAppliesTo?: number
): FineractEnumOption[] {
  const options = template.chargePaymentModeOptions ?? [];
  if (chargeAppliesTo === CHARGE_APPLIES_TO.WORKING_CAPITAL) {
    return options.filter((option) => option.id === 0);
  }
  return options;
}

export function showChargePaymentMode(chargeAppliesTo?: number): boolean {
  return chargeAppliesTo === CHARGE_APPLIES_TO.LOAN;
}

export function showSavingsChargeExtras(chargeAppliesTo?: number): boolean {
  return chargeAppliesTo === CHARGE_APPLIES_TO.SAVINGS;
}

export function showIncomeAccountField(chargeAppliesTo?: number): boolean {
  return chargeAppliesTo === CHARGE_APPLIES_TO.CLIENT;
}

export function showTaxGroupField(chargeAppliesTo?: number): boolean {
  return chargeAppliesTo !== CHARGE_APPLIES_TO.WORKING_CAPITAL;
}

/** Overdue instalment is always a penalty. Disbursement, tranche disbursement, and shares cannot be. */
export function penaltyLocked(
  chargeAppliesTo?: number,
  chargeTimeType?: number
): 'on' | 'off' | null {
  if (chargeTimeType === 9) {
    return 'on';
  }
  if (
    chargeTimeType === 1 ||
    chargeTimeType === 12 ||
    chargeAppliesTo === CHARGE_APPLIES_TO.SHARES
  ) {
    return 'off';
  }
  return null;
}

export function penaltyDisabled(chargeAppliesTo?: number, chargeTimeType?: number): boolean {
  return penaltyLocked(chargeAppliesTo, chargeTimeType) != null;
}

export function showMinMaxCap(
  chargeAppliesTo?: number,
  chargeTimeType?: number,
  chargeCalculationType?: number,
  useChargeTiers?: boolean,
  mode: 'create' | 'edit' = 'create'
): boolean {
  if (useChargeTiers) {
    return false;
  }
  if (chargeCalculationType === 5) {
    return mode !== 'edit' && chargeAppliesTo === CHARGE_APPLIES_TO.LOAN && chargeTimeType === 12;
  }
  if (chargeCalculationType !== 2) {
    return false;
  }
  if (chargeAppliesTo === CHARGE_APPLIES_TO.LOAN) {
    return true;
  }
  if (chargeAppliesTo === CHARGE_APPLIES_TO.SAVINGS) {
    return chargeTimeType === 16 || chargeTimeType === 5;
  }
  if (chargeAppliesTo === CHARGE_APPLIES_TO.SHARES) {
    return chargeTimeType === 14 || chargeTimeType === 15;
  }
  return false;
}

export function showChargeTiersToggle(
  chargeAppliesTo?: number,
  chargeTimeType?: number
): boolean {
  return isChargeTiersAllowed(chargeAppliesTo, chargeTimeType);
}

export function incomeAccountOptions(template: ChargeTemplate) {
  const income = template.incomeOrLiabilityAccountOptions?.incomeAccountOptions ?? [];
  const liability = template.incomeOrLiabilityAccountOptions?.liabilityAccountOptions ?? [];
  return liability.length > 0 ? income.concat(liability) : income;
}

export function feeOnMonthDayFromCharge(value: string | number[] | undefined): string {
  if (Array.isArray(value) && value.length >= 2) {
    return formatChargeMonthDay(Number(value[0]), Number(value[1])) ?? '';
  }
  if (typeof value === 'string') {
    const parsed = parseChargeMonthDay(value);
    return parsed ? (formatChargeMonthDay(parsed.month, parsed.day) ?? value) : value;
  }
  return '';
}
