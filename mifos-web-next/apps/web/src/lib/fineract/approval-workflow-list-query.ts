/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { WorkflowDefinition, WorkflowDefinitionStatus } from '@mifos/api-client';

/** Category filters applied from the floating sidebar (excludes inline search). */
export type ApprovalWorkflowListFilters = {
  moduleName?: string;
  status?: WorkflowDefinitionStatus;
};

export function countActiveApprovalWorkflowListFilters(
  filters: ApprovalWorkflowListFilters
): number {
  let count = 0;
  if (filters.moduleName) {
    count += 1;
  }
  if (filters.status) {
    count += 1;
  }
  return count;
}

export function filterApprovalWorkflowDefinitions(
  definitions: WorkflowDefinition[],
  search: string,
  filters: ApprovalWorkflowListFilters
): WorkflowDefinition[] {
  const query = search.trim().toLowerCase();
  return definitions.filter((definition) => {
    if (filters.moduleName && definition.moduleName !== filters.moduleName) {
      return false;
    }
    if (filters.status && definition.status !== filters.status) {
      return false;
    }
    if (!query) {
      return true;
    }
    return (
      definition.name.toLowerCase().includes(query) ||
      definition.moduleName.toLowerCase().includes(query) ||
      (definition.description?.toLowerCase().includes(query) ?? false)
    );
  });
}
