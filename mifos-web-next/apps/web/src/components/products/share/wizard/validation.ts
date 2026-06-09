/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertShareProductInput } from '@mifos/validation';
import {
  shareProductAccountingStepSchema,
  shareProductChargesStepSchema,
  shareProductCurrencyStepSchema,
  shareProductDetailsStepSchema,
  shareProductMarketPriceStepSchema,
  shareProductSettingsStepSchema,
  shareProductTermsStepSchema
} from '@mifos/validation';
import type { ZodTypeAny } from 'zod';
import type { StepErrors } from './types';

const STEP_SCHEMAS: Record<string, ZodTypeAny> = {
  details: shareProductDetailsStepSchema,
  currency: shareProductCurrencyStepSchema,
  terms: shareProductTermsStepSchema,
  settings: shareProductSettingsStepSchema,
  marketPrice: shareProductMarketPriceStepSchema,
  charges: shareProductChargesStepSchema,
  accounting: shareProductAccountingStepSchema
};

function stepPayload(stepId: string, draft: UpsertShareProductInput): unknown {
  if (stepId === 'details') return draft.details;
  if (stepId === 'currency') return draft.currency;
  if (stepId === 'terms') return draft.terms;
  if (stepId === 'settings') return draft.settings;
  if (stepId === 'marketPrice') return draft.marketPrice;
  if (stepId === 'charges') return draft.charges;
  if (stepId === 'accounting') return draft.accounting;
  return undefined;
}

function flattenZodErrors(stepId: string, issues: { path: PropertyKey[]; message: string }[]): StepErrors {
  const errors: StepErrors = {};
  for (const issue of issues) {
    const fieldPath = issue.path.map(String).join('.');
    const key = fieldPath ? `${stepId}.${fieldPath}` : stepId;
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateShareProductStep(
  stepId: string,
  draft: UpsertShareProductInput
): StepErrors {
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
