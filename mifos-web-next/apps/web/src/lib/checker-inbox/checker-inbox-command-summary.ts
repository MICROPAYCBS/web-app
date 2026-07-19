/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  formatAuditTrailFilterLabel,
  parseAuditTrailCommandFields
} from '@/lib/fineract/audit-trail-display';

const PREFERRED_COMMAND_KEYS = [
  'approvedLoanAmount',
  'transactionAmount',
  'amount',
  'principal',
  'approvedOnDate',
  'actualDisbursementDate',
  'expectedDisbursementDate',
  'transactionDate',
  'note',
  'locale',
  'dateFormat'
] as const;

function commandFieldRank(key: string): number {
  const topLevel = key.split('.')[0] ?? key;
  const index = PREFERRED_COMMAND_KEYS.indexOf(topLevel as (typeof PREFERRED_COMMAND_KEYS)[number]);
  return index >= 0 ? index : PREFERRED_COMMAND_KEYS.length + 1;
}

/** Human-readable bullets from a queued Fineract command payload. */
export function checkerCommandHighlights(
  commandAsJson: string | undefined,
  options?: { limit?: number }
): string[] {
  const limit = options?.limit ?? 4;
  return parseAuditTrailCommandFields(commandAsJson)
    .filter((field) => field.display.trim() && field.display !== '—' && field.display !== '{}')
    .sort((a, b) => commandFieldRank(a.key) - commandFieldRank(b.key))
    .slice(0, limit)
    .map((field) => `${field.label}: ${field.display}`);
}

export function describeCheckerInboxAction(actionName?: string, entityName?: string): string {
  const action = actionName ? formatAuditTrailFilterLabel(actionName) : 'Change';
  const entity = entityName ? formatAuditTrailFilterLabel(entityName) : 'record';
  return `${action} · ${entity}`;
}

export function buildCheckerInboxSummary(options: {
  actionName?: string;
  entityName?: string;
  subjectLabel?: string;
  customerName?: string;
  commandHighlights?: string[];
}): string | undefined {
  const parts: string[] = [];
  if (options.subjectLabel?.trim()) {
    parts.push(options.subjectLabel.trim());
  }
  if (options.customerName?.trim()) {
    parts.push(options.customerName.trim());
  }
  const action = describeCheckerInboxAction(options.actionName, options.entityName);
  if (parts.length === 0) {
    return action;
  }
  const highlight = options.commandHighlights?.[0];
  if (highlight) {
    return `${parts.join(' · ')} — ${highlight}`;
  }
  return `${parts.join(' · ')} — ${action}`;
}
