/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const JOB_SEQUENCE_OPERATION_CODES = ['ADVANCE_BUSINESS_DATE'] as const;

export const jobSequenceStepTypeSchema = z.enum(['SCHEDULER_JOB', 'OPERATION']);

const jobSequenceSchedulerStepSchema = z.object({
  stepOrder: z.coerce.number().int().positive('Step order must be a positive integer.'),
  stepType: z.literal('SCHEDULER_JOB'),
  jobShortName: z.string().trim().min(1, 'Select a scheduler job.'),
  operationCode: z.undefined().optional(),
  enabled: z.boolean().optional().default(true),
  stopOnFailure: z.boolean().optional().default(true)
});

const jobSequenceOperationStepSchema = z.object({
  stepOrder: z.coerce.number().int().positive('Step order must be a positive integer.'),
  stepType: z.literal('OPERATION'),
  operationCode: z.enum(JOB_SEQUENCE_OPERATION_CODES, {
    errorMap: () => ({ message: 'Select a platform operation.' })
  }),
  jobShortName: z.undefined().optional(),
  enabled: z.boolean().optional().default(true),
  stopOnFailure: z.boolean().optional().default(true)
});

export const jobSequenceStepSchema = z.discriminatedUnion('stepType', [
  jobSequenceSchedulerStepSchema,
  jobSequenceOperationStepSchema
]);

export const upsertJobSequenceSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.').max(100, 'Name must be at most 100 characters.'),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be at most 500 characters.')
      .optional()
      .or(z.literal('')),
    active: z.boolean().optional().default(true),
    steps: z.array(jobSequenceStepSchema).min(1, 'Add at least one step.')
  })
  .superRefine((data, ctx) => {
    const orders = data.steps.map((step) => step.stepOrder);
    const seen = new Set<number>();
    for (let i = 0; i < orders.length; i += 1) {
      const order = orders[i];
      if (seen.has(order)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Step order must be unique.',
          path: ['steps', i, 'stepOrder']
        });
      }
      seen.add(order);
    }
  });

export type UpsertJobSequenceInput = z.infer<typeof upsertJobSequenceSchema>;
export type JobSequenceStepInput = z.infer<typeof jobSequenceStepSchema>;

export function validateUpsertJobSequence(input: unknown) {
  return upsertJobSequenceSchema.safeParse(input);
}

/** Normalize stepOrder to 1..n and strip fields that do not apply to the step type. */
export function buildJobSequenceApiPayload(input: UpsertJobSequenceInput): {
  name: string;
  description?: string;
  active: boolean;
  steps: Array<{
    stepOrder: number;
    stepType: 'SCHEDULER_JOB' | 'OPERATION';
    jobShortName?: string;
    operationCode?: string;
    enabled: boolean;
    stopOnFailure: boolean;
  }>;
} {
  const description = input.description?.trim();
  return {
    name: input.name.trim(),
    ...(description ? { description } : {}),
    active: input.active !== false,
    steps: input.steps.map((step, index) => {
      const base = {
        stepOrder: index + 1,
        enabled: step.enabled !== false,
        stopOnFailure: step.stopOnFailure !== false
      };
      if (step.stepType === 'SCHEDULER_JOB') {
        return {
          ...base,
          stepType: 'SCHEDULER_JOB' as const,
          jobShortName: step.jobShortName.trim()
        };
      }
      return {
        ...base,
        stepType: 'OPERATION' as const,
        operationCode: step.operationCode
      };
    })
  };
}
