/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractCode {
  id: number;
  name: string;
  systemDefined?: boolean;
}

export interface FineractCodeValue {
  id: number;
  name: string;
  description?: string;
  position: number;
  /** Fineract may return `active` or `isActive` depending on version. */
  active?: boolean;
  isActive?: boolean;
}

export interface FineractCreateCodeResponse {
  resourceId?: number;
}

export interface FineractCreateCodeValueResponse {
  subResourceId?: number;
  resourceId?: number;
}
