/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type DashboardTimescale = 'Day' | 'Week' | 'Month';

export interface DashboardAmountBreakdown {
  pending: number;
  complete: number;
}

export interface DashboardTrendPoint {
  label: string;
  clients: number;
  loans: number;
}

export interface DashboardAnalytics {
  amountCollected: number | null;
  amountDisbursed: number | null;
  collectionBreakdown: DashboardAmountBreakdown | null;
  disbursementBreakdown: DashboardAmountBreakdown | null;
  trends: DashboardTrendPoint[] | null;
}

export interface DashboardOfficeOption {
  id: number;
  name: string;
  nameDecorated?: string;
}

export interface DashboardCurrencyOption {
  code: string;
  name?: string;
}
