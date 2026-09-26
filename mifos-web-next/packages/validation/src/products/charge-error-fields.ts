/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Charge globalisation codes that do not always include parameterName. */
const CHARGE_ERROR_FIELD_BY_CODE: Record<string, string> = {
  'error.msg.charge.due.at.disbursement.cannot.be.penalty': 'penalty',
  'error.msg.charge.must.be.penalty': 'penalty',
  'error.msg.charge.duplicate.name': 'name',
  'error.msg.charge.update.of.charge.applies.to.is.not.supported': 'chargeAppliesTo',
  'validation.msg.charges.taxGroupId.modification.not.supported': 'taxGroupId',
  'error.msg.charge.cannot.be.updated.it.is.used.in.loan': 'active',
  'error.msg.charge.frequency.cannot.be.updated.it.is.used.in.loan': 'feeFrequency',
  'validation.msg.charge.chargeCalculationType.is.not.one.of.expected.enumerations':
    'chargeCalculationType',
  'validation.msg.charge.chargeCalculationType.is.one.of.unwanted.enumerations':
    'chargeCalculationType',
  'validation.msg.charges.chargeCalculationType.savings.charge.calculation.type.percentage.allowed.only.for.withdrawal.or.NoActivity':
    'chargeCalculationType',
  'validation.msg.charge.minCap.not.supported.when.useChargeTiers': 'minCap',
  'validation.msg.charge.maxCap.not.supported.when.useChargeTiers': 'maxCap',
  'validation.msg.charge.useChargeTiers.not.supported.for.charge.applies.to': 'useChargeTiers',
  'validation.msg.charge.useChargeTiers.not.supported.for.charge.time.type': 'useChargeTiers',
  'validation.msg.charge.chargeTiers.required.when.useChargeTiers': 'chargeTiers',
  'validation.msg.charge.chargeTiers.not.allowed.when.useChargeTiers.false': 'chargeTiers',
  'error.msg.charge.tiers.required': 'chargeTiers'
};

/** Map a charge validation code onto a form field when parameterName is absent. */
export function resolveChargeErrorField(code: string | undefined): string | undefined {
  if (!code) {
    return undefined;
  }
  if (CHARGE_ERROR_FIELD_BY_CODE[code]) {
    return CHARGE_ERROR_FIELD_BY_CODE[code];
  }
  const tier = code.match(/chargeTiers\[(\d+)\]\.([A-Za-z]+)/);
  if (tier) {
    return `chargeTiers.${tier[1]}.${tier[2]}`;
  }
  return undefined;
}

export function normalizeErrorParameterPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, '.$1');
}
