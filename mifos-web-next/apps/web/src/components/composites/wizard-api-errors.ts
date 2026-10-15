/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useMemo, useState } from 'react';
import type { ZodTypeAny } from 'zod';
import { formatActionErrorMessage } from '@mifos/validation';

export type WizardFieldPlacement = {
  stepId: string;
  formKey: string;
};

export type WizardErrorSection = {
  stepId: string;
  /** Prepended to the parameter path. Empty when the form uses the parameter name itself. */
  prefix: string;
  fields: readonly string[];
};

export type PlacedWizardFieldErrors = {
  byStep: Record<string, Record<string, string>>;
  /** Affected steps, earliest in `stepOrder` first. */
  stepIds: string[];
  unmapped: Record<string, string>;
};

/** Field names on a Zod object, including objects wrapped in refinements. */
export function zodObjectFieldNames(schema: ZodTypeAny): string[] {
  let current: ZodTypeAny | undefined = schema;
  const seen = new Set<ZodTypeAny>();
  for (let depth = 0; depth < 6 && current && !seen.has(current); depth += 1) {
    seen.add(current);
    if ('shape' in current && current.shape && typeof current.shape === 'object') {
      return Object.keys(current.shape as Record<string, unknown>);
    }
    const readInner: (() => ZodTypeAny) | undefined = (
      current as { innerType?: () => ZodTypeAny }
    ).innerType;
    if (typeof readInner === 'function') {
      const next: ZodTypeAny = readInner.call(current);
      if (next && next !== current) {
        current = next;
        continue;
      }
    }
    const nested: ZodTypeAny | undefined = (current as { _def?: { schema?: ZodTypeAny } })._def
      ?.schema;
    if (nested && nested !== current) {
      current = nested;
      continue;
    }
    break;
  }
  return [];
}

export function wizardErrorSection(
  stepId: string,
  prefix: string,
  schema: ZodTypeAny,
  extraFields: readonly string[] = []
): WizardErrorSection {
  return {
    stepId,
    prefix,
    fields: [...new Set([...zodObjectFieldNames(schema), ...extraFields])]
  };
}

function parameterRoot(parameterName: string): string {
  const head = parameterName.split('.')[0] ?? parameterName;
  return head.replace(/\[\d+\]$/, '');
}

export function locateWizardField(
  sections: readonly WizardErrorSection[],
  parameterName: string
): WizardFieldPlacement | undefined {
  const normalized = parameterName.replace(/\[(\d+)\]/g, '.$1');
  const root = parameterRoot(normalized);
  const match = sections.find((section) => section.fields.includes(root));
  if (!match) {
    return undefined;
  }
  if (root === 'charges' && match.fields.includes('chargeIds')) {
    return { stepId: match.stepId, formKey: `${match.prefix}.chargeIds` };
  }
  const formKey = match.prefix ? `${match.prefix}.${normalized}` : normalized;
  return { stepId: match.stepId, formKey };
}

export function placeWizardFieldErrors(
  fieldErrors: Record<string, string> | undefined,
  locate: (parameterName: string) => WizardFieldPlacement | undefined,
  stepOrder: readonly string[]
): PlacedWizardFieldErrors {
  const byStep: Record<string, Record<string, string>> = {};
  const unmapped: Record<string, string> = {};

  for (const [field, message] of Object.entries(fieldErrors ?? {})) {
    if (!message || field === '_form') {
      if (message && field === '_form') {
        unmapped[field] = message;
      }
      continue;
    }
    const placement = locate(field);
    if (!placement) {
      unmapped[field] = message;
      continue;
    }
    const bucket = (byStep[placement.stepId] ??= {});
    if (!bucket[placement.formKey]) {
      bucket[placement.formKey] = message;
    }
  }

  const ordered = stepOrder.filter((id) => byStep[id] && Object.keys(byStep[id]).length > 0);
  const extras = Object.keys(byStep).filter((id) => !stepOrder.includes(id));
  return { byStep, stepIds: [...ordered, ...extras], unmapped };
}

export function omitWizardFieldErrors(
  fieldErrors: Record<string, string>,
  changedKeys: string[]
): Record<string, string> {
  if (changedKeys.length === 0) {
    return fieldErrors;
  }
  const changed = new Set(changedKeys);
  if (changed.has('chargeIds') || changed.has('chargeAmounts') || changed.has('charges')) {
    changed.add('charges');
    changed.add('chargeIds');
    changed.add('chargeAmounts');
  }
  const next: Record<string, string> = {};
  for (const [field, message] of Object.entries(fieldErrors)) {
    const root = parameterRoot(field);
    if (changed.has(root) || changed.has(field)) {
      continue;
    }
    next[field] = message;
  }
  return next;
}

/** Banner text for errors that are not already shown on a field. */
export function wizardServerFailureBanner(
  message: string,
  fieldErrors: Record<string, string> | undefined,
  placed: PlacedWizardFieldErrors
): string | null {
  const unmappedMessages = Object.values(placed.unmapped);
  if (unmappedMessages.length > 0) {
    return unmappedMessages.join('\n');
  }
  if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
    return formatActionErrorMessage(message);
  }
  return null;
}

export function mergeWizardStepErrors(
  fromApi: Record<string, string>,
  fromClient: Record<string, string>,
  includeClient: boolean
): Record<string, string> {
  if (!includeClient) {
    return fromApi;
  }
  return { ...fromApi, ...fromClient };
}

export function useWizardServerErrors(
  locate: (parameterName: string) => WizardFieldPlacement | undefined,
  stepOrder: readonly string[]
) {
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({});
  const placed = useMemo(
    () => placeWizardFieldErrors(apiFieldErrors, locate, stepOrder),
    [apiFieldErrors, locate, stepOrder]
  );

  const acceptFailure = useCallback(
    (message: string, fieldErrors?: Record<string, string>) => {
      const errors = fieldErrors ?? {};
      setApiFieldErrors(errors);
      const next = placeWizardFieldErrors(errors, locate, stepOrder);
      return {
        firstStepId: next.stepIds[0],
        banner: wizardServerFailureBanner(message, errors, next)
      };
    },
    [locate, stepOrder]
  );

  const clearChanged = useCallback((keys: string[]) => {
    setApiFieldErrors((current) => omitWizardFieldErrors(current, keys));
  }, []);

  const reset = useCallback(() => {
    setApiFieldErrors({});
  }, []);

  return { placed, acceptFailure, clearChanged, reset };
}
