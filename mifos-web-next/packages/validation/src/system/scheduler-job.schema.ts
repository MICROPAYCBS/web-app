/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const updateSchedulerJobSchema = z.object({
  displayName: z.string().trim().min(1, 'Job name is required.'),
  cronExpression: z.string().trim().min(1, 'Cron expression is required.'),
  active: z.boolean()
});

export const jobParameterSchema = z.object({
  parameterName: z.string().trim().min(1, 'Parameter name is required.'),
  parameterValue: z.string().trim().min(1, 'Parameter value is required.')
});

export const runJobWithParametersSchema = z.object({
  jobParameters: z.array(jobParameterSchema)
});

export const workflowJobStepSchema = z.object({
  stepName: z.string().trim().min(1, 'Step name is required.'),
  stepDescription: z.string().optional(),
  order: z.number().int().positive()
});

export const updateWorkflowJobStepsSchema = z.object({
  businessSteps: z.array(workflowJobStepSchema).min(1, 'At least one step is required.')
});

export const inlineCobSchema = z.object({
  loanIds: z.array(z.number().int().positive()).min(1, 'Select at least one loan.')
});

export type UpdateSchedulerJobInput = z.infer<typeof updateSchedulerJobSchema>;
export type JobParameterInput = z.infer<typeof jobParameterSchema>;
export type RunJobWithParametersInput = z.infer<typeof runJobWithParametersSchema>;
export type WorkflowJobStepInput = z.infer<typeof workflowJobStepSchema>;
export type UpdateWorkflowJobStepsInput = z.infer<typeof updateWorkflowJobStepsSchema>;
export type InlineCobInput = z.infer<typeof inlineCobSchema>;

export function validateUpdateSchedulerJob(input: unknown) {
  return updateSchedulerJobSchema.safeParse(input);
}

export function validateRunJobWithParameters(input: unknown) {
  return runJobWithParametersSchema.safeParse(input);
}

export function validateUpdateWorkflowJobSteps(input: unknown) {
  return updateWorkflowJobStepsSchema.safeParse(input);
}

export function validateInlineCob(input: unknown) {
  return inlineCobSchema.safeParse(input);
}
