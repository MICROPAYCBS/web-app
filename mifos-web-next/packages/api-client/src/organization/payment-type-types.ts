/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface OrganizationPaymentType {
  id: number;
  name: string;
  description?: string;
  codeName?: string;
  isSystemDefined?: boolean;
  isCashPayment?: boolean;
  position?: number;
  /** False stops new transactions that name this payment type. Omitted means active. */
  isActive?: boolean;
}

export interface OrganizationPaymentTypeMutationResponse {
  resourceId?: number;
}
