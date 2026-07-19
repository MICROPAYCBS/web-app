/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import type { WorkflowDefinitionWritePayload } from '@mifos/api-client';

export const workflowStageTypeSchema = z.enum(['REVIEW', 'APPROVAL', 'VERIFICATION']);
export const workflowRejectionPolicySchema = z.enum(['ANY', 'ALL', 'THRESHOLD']);
export const workflowExpiryPeriodUnitSchema = z.enum(['HOURS', 'DAYS']);
export const workflowApprovalActionSchema = z.enum(['APPROVE', 'REJECT', 'RETURN', 'ESCALATE']);

const optionalPositiveInt = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  },
  z.number().int().positive().nullable()
);

export const workflowStageSchema = z
  .object({
    stageCode: z.string().trim().min(1, 'Stage code is required.').max(100),
    name: z.string().trim().max(255).optional(),
    stageType: workflowStageTypeSchema,
    requiredApprovals: z.number().int().positive('Required approvals must be at least 1.'),
    rejectionPolicy: workflowRejectionPolicySchema.optional().nullable(),
    rejectionThreshold: optionalPositiveInt.optional(),
    expiryPeriodUnit: workflowExpiryPeriodUnitSchema.optional().nullable(),
    expiryPeriodValue: optionalPositiveInt.optional(),
    escalationEnabled: z.boolean().optional(),
    escalationTargetStageCode: z.string().trim().max(100).optional().nullable(),
    allowCrossBranchAccess: z.boolean().optional(),
    requireDistinctApprover: z.boolean().optional(),
    roleId: optionalPositiveInt.optional(),
    actions: z.array(workflowApprovalActionSchema).min(1, 'Select at least one action.')
  })
  .superRefine((stage, ctx) => {
    if (!stage.actions.includes('APPROVE')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'APPROVE must be enabled for each stage.',
        path: ['actions']
      });
    }

    if (stage.rejectionPolicy === 'THRESHOLD') {
      if (stage.rejectionThreshold == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Rejection threshold is required when policy is THRESHOLD.',
          path: ['rejectionThreshold']
        });
      }
    } else if (stage.rejectionThreshold != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rejection threshold is only allowed when policy is THRESHOLD.',
        path: ['rejectionThreshold']
      });
    }

    if (stage.escalationEnabled) {
      if (!stage.expiryPeriodUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiry period unit is required when escalation is enabled.',
          path: ['expiryPeriodUnit']
        });
      }
      if (stage.expiryPeriodValue == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiry period value is required when escalation is enabled.',
          path: ['expiryPeriodValue']
        });
      }
      if (!stage.escalationTargetStageCode?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Escalation target stage is required when escalation is enabled.',
          path: ['escalationTargetStageCode']
        });
      }
    }
  });

export const workflowTransitionSchema = z.object({
  fromStageCode: z.string().trim().min(1, 'From stage is required.'),
  toStageCode: z.string().trim().min(1, 'To stage is required.'),
  sequenceNo: z.number().int().positive('Sequence must be at least 1.')
});

export const upsertWorkflowDefinitionSchema = z
  .object({
    taskPermissionCode: z.string().trim().min(1, 'Task is required.').max(100),
    name: z.string().trim().min(1, 'Name is required.').max(255),
    description: z.string().trim().max(1000).optional(),
    priority: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return null;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
      },
      z.number().int().min(0).nullable().optional()
    ),
    stages: z.array(workflowStageSchema).min(1, 'Add at least one stage.'),
    transitions: z.array(workflowTransitionSchema)
  })
  .superRefine((definition, ctx) => {
    const stageCodes = new Set(definition.stages.map((stage) => stage.stageCode.trim()));
    definition.transitions.forEach((transition, index) => {
      if (!stageCodes.has(transition.fromStageCode.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'From stage must match a defined stage code.',
          path: ['transitions', index, 'fromStageCode']
        });
      }
      if (!stageCodes.has(transition.toStageCode.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'To stage must match a defined stage code.',
          path: ['transitions', index, 'toStageCode']
        });
      }
    });

    definition.stages.forEach((stage, stageIndex) => {
      if (stage.escalationEnabled && stage.escalationTargetStageCode?.trim()) {
        if (!stageCodes.has(stage.escalationTargetStageCode.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Escalation target must match a defined stage code.',
            path: ['stages', stageIndex, 'escalationTargetStageCode']
          });
        }
      }
    });
  });

export type WorkflowStageInput = z.infer<typeof workflowStageSchema>;
export type WorkflowTransitionInput = z.infer<typeof workflowTransitionSchema>;
export type UpsertWorkflowDefinitionInput = z.infer<typeof upsertWorkflowDefinitionSchema>;

export function validateUpsertWorkflowDefinition(input: unknown) {
  return upsertWorkflowDefinitionSchema.safeParse(input);
}

export function buildWorkflowDefinitionApiPayload(
  input: UpsertWorkflowDefinitionInput
): WorkflowDefinitionWritePayload {
  return {
    taskPermissionCode: input.taskPermissionCode.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    priority: input.priority ?? undefined,
    stages: input.stages.map((stage) => ({
      stageCode: stage.stageCode.trim(),
      name: stage.name?.trim() || undefined,
      stageType: stage.stageType,
      requiredApprovals: stage.requiredApprovals,
      rejectionPolicy: stage.rejectionPolicy ?? undefined,
      rejectionThreshold: stage.rejectionThreshold ?? undefined,
      expiryPeriodUnit: stage.expiryPeriodUnit ?? undefined,
      expiryPeriodValue: stage.expiryPeriodValue ?? undefined,
      escalationEnabled: stage.escalationEnabled ?? false,
      escalationTargetStageCode: stage.escalationTargetStageCode?.trim() || undefined,
      allowCrossBranchAccess: stage.allowCrossBranchAccess ?? false,
      requireDistinctApprover: stage.requireDistinctApprover ?? true,
      roleId: stage.roleId ?? undefined,
      actions: stage.actions
    })),
    transitions: input.transitions.map((transition) => ({
      fromStageCode: transition.fromStageCode.trim(),
      toStageCode: transition.toStageCode.trim(),
      sequenceNo: transition.sequenceNo
    }))
  };
}
