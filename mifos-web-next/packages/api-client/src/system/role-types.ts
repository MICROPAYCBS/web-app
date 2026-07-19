/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractRoleListItem {
  id: number;
  name: string;
  description: string;
  disabled: boolean;
}

export interface FineractRolePermissionUsage {
  grouping: string;
  code: string;
  selected: boolean;
  entityName?: string;
  actionName?: string;
}

export interface FineractRolePermissionsDetail {
  id: number;
  name: string;
  description: string;
  disabled: boolean;
  permissionUsageData: FineractRolePermissionUsage[];
}

export interface FineractRoleMutationResponse {
  resourceId?: number;
}
