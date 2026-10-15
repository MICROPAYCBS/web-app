/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertSavingsProductInput } from '@mifos/validation';
import {
  savingsProductAccountingCoreStepSchema,
  savingsProductChargesStepSchema,
  savingsProductPaymentChannelsStepSchema,
  savingsProductCurrencyStepSchema,
  savingsProductDetailsStepSchema,
  savingsProductMappingsStepSchema,
  savingsProductSettingsStepSchema,
  savingsProductTermsStepSchema,
  validateSavingsProductAccounting
} from '@mifos/validation';
import type { ZodTypeAny } from 'zod';
import {
  locateWizardField,
  wizardErrorSection,
  type WizardFieldPlacement
} from '@/components/composites/wizard-api-errors';
import type { StepErrors } from './types';

const STEP_SCHEMAS: Record<string, ZodTypeAny> = {
  details: savingsProductDetailsStepSchema,
  currency: savingsProductCurrencyStepSchema,
  terms: savingsProductTermsStepSchema,
  settings: savingsProductSettingsStepSchema,
  charges: savingsProductChargesStepSchema,
  channels: savingsProductPaymentChannelsStepSchema,
  mappings: savingsProductMappingsStepSchema
};

function stepPayload(stepId: string, draft: UpsertSavingsProductInput): unknown {
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
  if (stepId === 'terms') return draft.terms;
  if (stepId === 'settings') return draft.settings;
  if (stepId === 'charges') return draft.charges;
  if (stepId === 'channels') return draft.paymentChannels;

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

export function validateSavingsProductStep(
  stepId: string,
  draft: UpsertSavingsProductInput
): StepErrors {
  if (stepId === 'preview') {
    return {};
  }

  if (stepId === 'accounting') {
    const schema = validateSavingsProductAccounting(draft.accounting, {
      allowOverdraft: draft.settings.allowOverdraft,
      isDormancyTrackingActive: draft.settings.isDormancyTrackingActive
    });
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

const SAVINGS_ERROR_SECTIONS = [
  wizardErrorSection('details', 'details', savingsProductDetailsStepSchema),
  wizardErrorSection('currency', 'currency', savingsProductCurrencyStepSchema),
  wizardErrorSection('terms', 'terms', savingsProductTermsStepSchema),
  wizardErrorSection('settings', 'settings', savingsProductSettingsStepSchema),
  wizardErrorSection('charges', 'charges', savingsProductChargesStepSchema, ['charges']),
  wizardErrorSection('accounting', 'accounting', savingsProductAccountingCoreStepSchema),
  wizardErrorSection('mappings', 'accounting', savingsProductMappingsStepSchema)
];

export function locateSavingsProductField(parameterName: string): WizardFieldPlacement | undefined {
  const normalized = parameterName.replace(/\[(\d+)\]/g, '.$1');
  const root = normalized.split('.')[0]?.replace(/\[\d+\]$/, '') ?? normalized;
  if (root === 'paymentChannels' || root === 'channels') {
    const rest = normalized.replace(/^(paymentChannels|channels)\.?/, '');
    return {
      stepId: 'channels',
      formKey: rest ? `channels.channels.${rest}` : 'channels.channels'
    };
  }
  return locateWizardField(SAVINGS_ERROR_SECTIONS, parameterName);
}
