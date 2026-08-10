/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertChargeInput } from '@mifos/validation';
import { upsertChargeSchema } from '@mifos/validation';
import type { ChargeWizardDraft, StepErrors } from './types';

const STEP_FIELDS: Record<string, readonly string[]> = {
  appliesTo: ['chargeAppliesTo'],
  terms: [
    'name',
    'currencyCode',
    'chargeTimeType',
    'chargeCalculationType',
    'chargePaymentMode',
    'feeInterval',
    'feeFrequency',
    'feeOnMonthDay'
  ],
  amount: [
    'amount',
    'minCap',
    'maxCap',
    'incomeAccountId',
    'taxGroupId',
    'useChargeTiers',
    'chargeTiers'
  ]
};

export function validateChargeStep(stepId: string, draft: ChargeWizardDraft): StepErrors {
  if (stepId === 'appliesTo') {
    if (!draft.chargeAppliesTo) {
      return { chargeAppliesTo: 'Applies to is required.' };
    }
    return {};
  }

  if (stepId === 'preview') {
    return {};
  }

  const parsed = upsertChargeSchema.safeParse(draft);
  if (parsed.success) {
    return {};
  }

  const fields = STEP_FIELDS[stepId] ?? [];
  const errors: StepErrors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && fields.includes(key)) {
      const pathKey = issue.path.join('.');
      if (pathKey && !errors[pathKey]) {
        errors[pathKey] = issue.message;
      }
    }
  }
  return errors;
}

export function validateChargeDraft(draft: ChargeWizardDraft): StepErrors {
  const parsed = upsertChargeSchema.safeParse(draft);
  if (parsed.success) {
    return {};
  }
  const errors: StepErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.');
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function draftToPayload(draft: ChargeWizardDraft): UpsertChargeInput {
  const useChargeTiers = draft.useChargeTiers === true;
  const chargeTiers = useChargeTiers
    ? (draft.chargeTiers ?? []).map((tier) => ({
        amountRangeFrom: Number(tier.amountRangeFrom),
        amountRangeTo: tier.amountRangeTo == null ? null : Number(tier.amountRangeTo),
        amount: Number(tier.amount)
      }))
    : [];

  return {
    chargeAppliesTo: draft.chargeAppliesTo ?? 0,
    name: draft.name ?? '',
    currencyCode: draft.currencyCode ?? '',
    chargeTimeType: draft.chargeTimeType ?? 0,
    chargeCalculationType: draft.chargeCalculationType ?? 0,
    amount: useChargeTiers ? 0 : (draft.amount ?? 0),
    active: draft.active ?? false,
    penalty: draft.penalty ?? false,
    chargePaymentMode: draft.chargePaymentMode,
    incomeAccountId: draft.incomeAccountId,
    taxGroupId: draft.taxGroupId,
    minCap: useChargeTiers ? undefined : draft.minCap,
    maxCap: useChargeTiers ? undefined : draft.maxCap,
    feeInterval: draft.feeInterval,
    feeFrequency: draft.feeFrequency,
    feeOnMonthDay: draft.feeOnMonthDay,
    addFeeFrequency: draft.addFeeFrequency,
    useChargeTiers,
    chargeTiers
  };
}
