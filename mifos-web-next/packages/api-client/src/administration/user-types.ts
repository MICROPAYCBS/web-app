/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractUserListItem {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  officeName: string;
  isSelfServiceUser: boolean;
}

export interface FineractUserRoleRef {
  id: number;
  name: string;
}

export interface FineractUserStaffRef {
  id: number;
  displayName: string;
}

export interface FineractUserDetail {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  officeId: number;
  officeName: string;
  isSelfServiceUser: boolean;
  passwordNeverExpires: boolean;
  isLoginRetriesEnabled: boolean;
  isPasswordResetAllowed: boolean;
  selectedRoles: FineractUserRoleRef[];
  staff?: FineractUserStaffRef | null;
}

export interface FineractUserEditContext {
  user: FineractUserDetail;
  template: FineractUserTemplate;
}

export interface FineractUserTemplate {
  allowedOffices: Array<{ id: number; name: string; nameDecorated?: string }>;
  availableRoles: Array<{ id: number; name: string }>;
}

export interface FineractUserMutationResponse {
  resourceId?: number;
}
