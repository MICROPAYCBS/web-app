/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type LegalTenderType = 'NOTE' | 'COIN';

export interface CurrencyLegalTender {
  id: number;
  currencyCode: string;
  value: number;
  tenderType: LegalTenderType;
  label: string;
  displayOrder: number;
  active: boolean;
}

export interface CurrencyLegalTenderMutationResponse {
  resourceId?: number;
}

export interface CashierLegalTenderLine {
  legalTenderId: number;
  quantity: number;
}

export interface CashierLegalTenderLineDetail extends CashierLegalTenderLine {
  label: string;
  tenderType: LegalTenderType;
  value: number;
  lineAmount: number;
}
