/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeTemplate, FineractEnumOption } from '@mifos/api-client';

export const CHARGE_APPLIES_TO = {
  LOAN: 1,
  SAVINGS: 2,
  CLIENT: 3,
  SHARES: 4,
  WORKING_CAPITAL: 5
} as const;

export function chargeTimeTypeOptions(
  template: ChargeTemplate,
  chargeAppliesTo?: number
): FineractEnumOption[] {
  switch (chargeAppliesTo) {
    case CHARGE_APPLIES_TO.LOAN:
      return template.loanChargeTimeTypeOptions ?? [];
    case CHARGE_APPLIES_TO.SAVINGS:
      return template.savingsChargeTimeTypeOptions ?? [];
    case CHARGE_APPLIES_TO.CLIENT:
      return template.clientChargeTimeTypeOptions ?? [];
    case CHARGE_APPLIES_TO.SHARES:
      return template.shareChargeTimeTypeOptions ?? [];
    case CHARGE_APPLIES_TO.WORKING_CAPITAL:
      return (template.loanChargeTimeTypeOptions ?? []).filter((option) => option.id === 2);
    default:
      return [];
  }
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
    case CHARGE_APPLIES_TO.WORKING_CAPITAL:
      return (template.loanChargeCalculationTypeOptions ?? []).filter((option) => option.id === 1);
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
    if (chargeTimeType === 12 && (option.id === 3 || option.id === 4)) {
      return false;
    }
    if (chargeTimeType !== 12 && option.id === 5) {
      return false;
    }
    if (chargeAppliesTo === CHARGE_APPLIES_TO.SAVINGS) {
      if (
        !(
          chargeTimeType === 5 ||
          chargeTimeType === 16 ||
          chargeTimeType === 17
        ) &&
        option.id === 2
      ) {
        return false;
      }
    }
    if (chargeAppliesTo === CHARGE_APPLIES_TO.WORKING_CAPITAL) {
      return option.id === 1;
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
  return (
    chargeAppliesTo === CHARGE_APPLIES_TO.LOAN ||
    chargeAppliesTo === CHARGE_APPLIES_TO.WORKING_CAPITAL
  );
}

export function showIncomeAccountField(chargeAppliesTo?: number): boolean {
  return chargeAppliesTo === CHARGE_APPLIES_TO.CLIENT;
}

export function showTaxGroupField(chargeAppliesTo?: number): boolean {
  return chargeAppliesTo !== CHARGE_APPLIES_TO.WORKING_CAPITAL;
}

export function penaltyDisabled(chargeAppliesTo?: number): boolean {
  return chargeAppliesTo === CHARGE_APPLIES_TO.SHARES;
}

export function showMinMaxCap(
  chargeAppliesTo?: number,
  chargeTimeType?: number,
  chargeCalculationType?: number
): boolean {
  if (chargeAppliesTo === CHARGE_APPLIES_TO.LOAN) {
    return [2, 3, 4, 5].includes(chargeCalculationType ?? -1);
  }
  if (chargeAppliesTo === CHARGE_APPLIES_TO.SAVINGS) {
    return (
      (chargeTimeType === 16 || chargeTimeType === 5) && chargeCalculationType === 2
    );
  }
  if (chargeAppliesTo === CHARGE_APPLIES_TO.SHARES) {
    return (
      (chargeTimeType === 14 || chargeTimeType === 15) && chargeCalculationType === 2
    );
  }
  return false;
}

export function incomeAccountOptions(template: ChargeTemplate) {
  const income = template.incomeOrLiabilityAccountOptions?.incomeAccountOptions ?? [];
  const liability = template.incomeOrLiabilityAccountOptions?.liabilityAccountOptions ?? [];
  return liability.length > 0 ? income.concat(liability) : income;
}

export function feeOnMonthDayFromCharge(value: string | number[] | undefined): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value.length >= 2) {
    const [month, day] = value;
    const date = new Date(2000, month - 1, day);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
  return '';
}
