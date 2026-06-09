/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractGlobalConfiguration {
  id: number;
  name: string;
  enabled: boolean;
  value?: number | null;
  stringValue?: string | null;
  dateValue?: string | number[] | null;
  description?: string | null;
  trapDoor?: boolean;
}

export interface FineractGlobalConfigurationListResponse {
  globalConfiguration?: FineractGlobalConfiguration[];
}

export interface FineractGlobalConfigurationUpdateChanges {
  enabled?: boolean;
  value?: number | null;
  stringValue?: string | null;
  dateValue?: string | null;
}

export interface FineractGlobalConfigurationUpdateResponse {
  resourceId?: number;
  changes?: FineractGlobalConfigurationUpdateChanges;
}
