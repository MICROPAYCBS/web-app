/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertLoanProductInput } from '@mifos/validation';
import {
  loanProductAccountingCoreStepSchema,
  loanProductChargesStepSchema,
  loanProductCurrencyStepSchema,
  loanProductDetailsStepSchema,
  loanProductMappingsStepSchema,
  loanProductSettingsStepSchema,
  loanProductTermsStepSchema
} from '@mifos/validation';
import type { ZodTypeAny } from 'zod';
import type { StepErrors } from './types';

const STEP_SCHEMAS: Record<string, ZodTypeAny> = {
  details: loanProductDetailsStepSchema,
  currency: loanProductCurrencyStepSchema,
  settings: loanProductSettingsStepSchema,
  terms: loanProductTermsStepSchema,
  charges: loanProductChargesStepSchema,
  accounting: loanProductAccountingCoreStepSchema,
  mappings: loanProductMappingsStepSchema
};

export type LoanProductWizardStepId = keyof typeof STEP_SCHEMAS;

function stepPayload(stepId: string, draft: UpsertLoanProductInput): unknown {
  if (stepId === 'mappings') {
    return {
      paymentChannelToFundSourceMappings: draft.accounting.paymentChannelToFundSourceMappings,
      feeToIncomeAccountMappings: draft.accounting.feeToIncomeAccountMappings,
      penaltyToIncomeAccountMappings: draft.accounting.penaltyToIncomeAccountMappings
    };
  }

  if (stepId === 'accounting') {
    const {
      paymentChannelToFundSourceMappings: _channels,
      feeToIncomeAccountMappings: _fees,
      penaltyToIncomeAccountMappings: _penalties,
      ...core
    } = draft.accounting;
    return core;
  }

  if (stepId === 'details') return draft.details;
  if (stepId === 'currency') return draft.currency;
  if (stepId === 'settings') return draft.settings;
  if (stepId === 'terms') return draft.terms;
  if (stepId === 'charges') return draft.charges;

  return undefined;
}

function flattenZodErrors(stepId: string, issues: { path: PropertyKey[]; message: string }[]): StepErrors {
  const errors: StepErrors = {};
  for (const issue of issues) {
    const fieldPath = issue.path.map(String).join('.');
    const prefix = stepId === 'accounting' || stepId === 'mappings' ? 'accounting' : stepId;
    const key = fieldPath ? `${prefix}.${fieldPath}` : prefix;
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateLoanProductStep(stepId: string, draft: UpsertLoanProductInput): StepErrors {
  if (stepId === 'preview') {
    return {};
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
