/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertDepositProductInput } from '@mifos/validation';
import {
  depositProductChargesStepSchema,
  depositProductCurrencyStepSchema,
  depositProductDetailsStepSchema,
  depositProductInterestRateChartStepSchema,
  depositProductSettingsStepSchema,
  depositProductTermsStepSchema,
  validateDepositProductAccounting
} from '@mifos/validation';
import type { ZodTypeAny } from 'zod';
import type { StepErrors } from './types';

const STEP_SCHEMAS: Record<string, ZodTypeAny> = {
  details: depositProductDetailsStepSchema,
  currency: depositProductCurrencyStepSchema,
  terms: depositProductTermsStepSchema,
  settings: depositProductSettingsStepSchema,
  interestRateChart: depositProductInterestRateChartStepSchema,
  charges: depositProductChargesStepSchema
};

function stepPayload(stepId: string, draft: UpsertDepositProductInput): unknown {
  if (stepId === 'accounting') {
    const {
      paymentChannelToFundSourceMappings: _channels,
      feeToIncomeAccountMappings: _fees,
      penaltyToIncomeAccountMappings: _penalties,
      advancedAccountingRules: _advanced,
      ...core
    } = draft.accounting;
    return core;
  }

  if (stepId === 'details') return draft.details;
  if (stepId === 'currency') return draft.currency;
  if (stepId === 'terms') return draft.terms;
  if (stepId === 'settings') return draft.settings;
  if (stepId === 'interestRateChart') return draft.interestRateChart;
  if (stepId === 'charges') return draft.charges;

  return undefined;
}

function flattenZodErrors(
  stepId: string,
  issues: { path: PropertyKey[]; message: string }[]
): StepErrors {
  const errors: StepErrors = {};
  for (const issue of issues) {
    const fieldPath = issue.path.map(String).join('.');
    const prefix = stepId === 'accounting' ? 'accounting' : stepId;
    const key = fieldPath ? `${prefix}.${fieldPath}` : prefix;
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateDepositProductStep(
  stepId: string,
  draft: UpsertDepositProductInput
): StepErrors {
  if (stepId === 'preview') {
    return {};
  }

  if (stepId === 'accounting') {
    const schema = validateDepositProductAccounting(draft.accounting);
    const section = stepPayload('accounting', draft);
    const result = schema.safeParse(section);
    if (result.success) {
      return {};
    }
    return flattenZodErrors('accounting', result.error.issues);
  }

  const schema = STEP_SCHEMAS[stepId];
  if (!schema) {
    return {};
  }

  const section = stepPayload(stepId, draft);
  const result = schema.safeParse(section);
  if (result.success) {
    return {};
  }

  return flattenZodErrors(stepId, result.error.issues);
}
