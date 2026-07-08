/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  validateUpsertWorkflowDefinition,
  workflowStageSchema,
  workflowTransitionSchema,
  type UpsertWorkflowDefinitionInput
} from '@mifos/validation';
import type { StepErrors } from './types';

function zodIssuesToErrors(
  issues: { path: (string | number)[]; message: string }[],
  prefix?: string
): StepErrors {
  const errors: StepErrors = {};
  for (const issue of issues) {
    const key = [prefix, ...issue.path.map(String)].filter(Boolean).join('.');
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

function validateBasicsStep(draft: UpsertWorkflowDefinitionInput): StepErrors {
  const errors: StepErrors = {};
  if (!draft.taskPermissionCode?.trim()) {
    errors.taskPermissionCode = 'Task is required.';
  }
  if (!draft.name?.trim()) {
    errors.name = 'Name is required.';
  }
  return errors;
}

function validateCriteriaStep(draft: UpsertWorkflowDefinitionInput): StepErrors {
  const errors: StepErrors = {};
  const hasAmountCriteria = draft.minAmount != null || draft.maxAmount != null;
  if (hasAmountCriteria && !draft.currencyCode?.trim()) {
    errors.currencyCode = 'Currency is required when amount criteria are set.';
  }
  if (
    draft.minAmount != null &&
    draft.maxAmount != null &&
    draft.minAmount > draft.maxAmount
  ) {
    errors.minAmount = 'Minimum amount cannot exceed maximum amount.';
  }
  return errors;
}

function validateStagesStep(draft: UpsertWorkflowDefinitionInput): StepErrors {
  const errors: StepErrors = {};
  if (!draft.stages.length) {
    errors.stages = 'Add at least one stage.';
    return errors;
  }

  const stageCodes = new Set(draft.stages.map((stage) => stage.stageCode.trim()));
  draft.stages.forEach((stage, stageIndex) => {
    const result = workflowStageSchema.safeParse(stage);
    if (!result.success) {
      Object.assign(errors, zodIssuesToErrors(result.error.issues, `stages.${stageIndex}`));
    }
    if (stage.escalationEnabled && stage.escalationTargetStageCode?.trim()) {
      if (!stageCodes.has(stage.escalationTargetStageCode.trim())) {
        errors[`stages.${stageIndex}.escalationTargetStageCode`] =
          'Escalation target must match a defined stage code.';
      }
    }
  });
  return errors;
}

function validateTransitionsStep(draft: UpsertWorkflowDefinitionInput): StepErrors {
  const errors: StepErrors = {};
  const stageCodes = new Set(draft.stages.map((stage) => stage.stageCode.trim()));

  if (draft.stages.length >= 2 && draft.transitions.length === 0) {
    errors.transitions =
      'Connect your stages with transitions. Multiple stages need a single entry point and a reachable path before activation.';
  }

  draft.transitions.forEach((transition, transitionIndex) => {
    const result = workflowTransitionSchema.safeParse(transition);
    if (!result.success) {
      Object.assign(
        errors,
        zodIssuesToErrors(result.error.issues, `transitions.${transitionIndex}`)
      );
    }
    if (!stageCodes.has(transition.fromStageCode.trim())) {
      errors[`transitions.${transitionIndex}.fromStageCode`] =
        'From stage must match a defined stage code.';
    }
    if (!stageCodes.has(transition.toStageCode.trim())) {
      errors[`transitions.${transitionIndex}.toStageCode`] =
        'To stage must match a defined stage code.';
    }
  });

  return errors;
}

export function validateWorkflowWizardStep(
  stepId: string,
  draft: UpsertWorkflowDefinitionInput
): StepErrors {
  switch (stepId) {
    case 'basics':
      return validateBasicsStep(draft);
    case 'criteria':
      return validateCriteriaStep(draft);
    case 'stages':
      return validateStagesStep(draft);
    case 'transitions':
      return validateTransitionsStep(draft);
    case 'review':
      return {};
    default:
      return {};
  }
}

export function validateWorkflowWizardDraft(draft: UpsertWorkflowDefinitionInput): StepErrors {
  const parsed = validateUpsertWorkflowDefinition(draft);
  if (parsed.success) {
    return {};
  }
  return zodIssuesToErrors(parsed.error.issues);
}

export function stepForField(fieldKey: string): string {
  if (fieldKey.startsWith('stages')) {
    return 'stages';
  }
  if (fieldKey.startsWith('transitions')) {
    return 'transitions';
  }
  if (['currencyCode', 'minAmount', 'maxAmount'].includes(fieldKey)) {
    return 'criteria';
  }
  return 'basics';
}
