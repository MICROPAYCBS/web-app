/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem, WorkflowDefinition, WorkflowInstance } from '@mifos/api-client';

/** Active workflow definition selected for a queued maker-checker item. */
export type CheckerInboxMatchedWorkflow = {
  definition: WorkflowDefinition;
  taskPermissionCode: string;
};

/** Review context attached to a maker-checker inbox row (SSR-enriched). */
export type CheckerInboxItemContext = {
  /** In-app route to the affected record, when resolvable. */
  href?: string;
  /** Short link label, e.g. "Open loan account". */
  hrefLabel?: string;
  /** Primary subject line — product name, account no., or customer. */
  subjectLabel?: string;
  /** Customer / member name when known. */
  customerName?: string;
  /** One-line description of what the checker is approving. */
  summary?: string;
  /** Key field changes from the queued command (for table + confirm dialogs). */
  commandHighlights?: string[];
  /** Institution has approval workflows enabled (tenant configuration). */
  approvalWorkflowsEnabled?: boolean;
  /** Workflow that would apply to this queued command, when resolvable. */
  matchedWorkflow?: CheckerInboxMatchedWorkflow;
  /** Resolved maker-checker task when workflows are enabled but none matched. */
  unresolvedTaskPermissionCode?: string;
  /** Derived task permission code, e.g. APPROVE_LOAN. */
  taskPermissionCode?: string;
  /** Runtime workflow instance for this held command, when available. */
  workflowInstance?: WorkflowInstance | null;
};

export type CheckerInboxEnrichedItem = CheckerInboxListItem & {
  context: CheckerInboxItemContext;
};
