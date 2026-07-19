/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage } from '@mifos/api-client';
import {
  formatWorkflowTaskDisplay,
  workflowStageCheckerPermissionCode
} from '@/lib/fineract/approval-workflow-display';

const SAME_MAKER_CHECKER_PATTERN = /can\s*not\s*be\s*checked\s*by\s*the\s*same\s*user/i;
const NOT_AWAITING_APPROVAL_PATTERN = /not\s+awaiting\s+approval/i;
const WORKFLOW_CHECKER_PERMISSION_PATTERN =
  /requires\s+([A-Z][A-Z0-9_]*_CHECKER)\)/i;
const WORKFLOW_STAGE_PATTERN = /workflow stage\s+([A-Z0-9_]+)/i;
const CHECKER_AUTHORITY_PATTERN = /no authority to be a checker for:\s*([A-Z][A-Z0-9_]*)/i;
const PERMISSION_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function formatTaskPermissionLabel(
  taskPermissionCode: string,
  taskPermissions?: FineractRolePermissionUsage[]
): string {
  const display = formatWorkflowTaskDisplay(taskPermissionCode, taskPermissions);
  return display.subtitle ? `${display.subtitle} (${display.code})` : display.code;
}

function formatCheckerPermissionLabel(
  checkerPermissionCode: string,
  taskPermissions?: FineractRolePermissionUsage[]
): string {
  const taskCode = checkerPermissionCode.endsWith('_CHECKER')
    ? checkerPermissionCode.slice(0, -'_CHECKER'.length)
    : checkerPermissionCode;
  return formatTaskPermissionLabel(taskCode, taskPermissions);
}

/** User-facing checker inbox failure copy with workflow and permission context. */
export function formatCheckerInboxActionError(
  message: string,
  options?: {
    taskPermissionCode?: string;
    taskPermissions?: FineractRolePermissionUsage[];
  }
): string {
  const text = message.trim();
  if (!text) {
    return 'Could not complete this checker action.';
  }

  if (SAME_MAKER_CHECKER_PATTERN.test(text)) {
    return 'You cannot approve or reject your own submission. Ask another checker to act on this item.';
  }

  if (NOT_AWAITING_APPROVAL_PATTERN.test(text)) {
    return 'This task is not awaiting approval, so it cannot be approved, rejected, or deleted.';
  }

  const workflowCheckerMatch = text.match(WORKFLOW_CHECKER_PERMISSION_PATTERN);
  if (workflowCheckerMatch) {
    const checkerPermission = workflowCheckerMatch[1];
    const stageMatch = text.match(WORKFLOW_STAGE_PATTERN);
    const stageSuffix = stageMatch ? ` at stage ${stageMatch[1]}` : ' at this workflow stage';
    return `You need the ${formatCheckerPermissionLabel(checkerPermission, options?.taskPermissions)} permission${stageSuffix}.`;
  }

  const checkerAuthorityMatch = text.match(CHECKER_AUTHORITY_PATTERN);
  if (checkerAuthorityMatch) {
    const taskPermission = checkerAuthorityMatch[1];
    return `You need the ${formatCheckerPermissionLabel(`${taskPermission}_CHECKER`, options?.taskPermissions)} permission to complete this checker action.`;
  }

  if (PERMISSION_CODE_PATTERN.test(text) && options?.taskPermissionCode) {
    const checkerPermission = workflowStageCheckerPermissionCode(options.taskPermissionCode);
    return `You need the ${formatCheckerPermissionLabel(checkerPermission, options?.taskPermissions)} permission to act at this workflow stage.`;
  }

  if (PERMISSION_CODE_PATTERN.test(text)) {
    return `You need the ${formatCheckerPermissionLabel(`${text}_CHECKER`, options?.taskPermissions)} permission to complete this checker action.`;
  }

  return text;
}
