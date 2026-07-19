/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type DashboardKpiWidgetId =
  | 'all_customers'
  | 'active_customers'
  | 'active_loans'
  | 'pending_approval'
  | 'pending_disbursal'
  | 'disbursed_today'
  | 'disbursed_this_month'
  | 'expected_collections'
  | 'loans_in_arrears'
  | 'portfolio_at_risk'
  | 'savings_accounts'
  | 'checker_pending'
  | 'cashier_balance';

export type DashboardKpiVariant = 'default' | 'primary' | 'success' | 'warning' | 'destructive';

export interface DashboardKpiWidgetDefinition {
  id: DashboardKpiWidgetId;
  title: string;
  description: string;
  category: 'customers' | 'loans' | 'collections' | 'savings' | 'operations';
  variant: DashboardKpiVariant;
  href?: string;
  permission?: 'clients' | 'loans' | 'savings' | 'reports' | 'checker' | 'collections' | 'cashier';
}

export interface DashboardKpis {
  officeId: number | null;
  currencyCode: string | null;
  businessDate: string | null;
  customers: {
    total: number | null;
    active: number | null;
  };
  loans: {
    active: number | null;
    pendingApproval: number | null;
    pendingDisbursal: number | null;
    inArrears: number | null;
    portfolioAtRiskPercent: number | null;
    disbursedTodayAmount: number | null;
    disbursedMonthAmount: number | null;
  };
  collections: {
    expectedAmount: number | null;
    expectedLoanCount: number | null;
  };
  savings: {
    total: number | null;
  };
  checkerInboxPending: number | null;
  cashier: {
    label: string;
    tellerId: number;
    cashierId: number;
    canOpenDetail: boolean;
  } | null;
}

export interface DashboardKpiFetchOptions {
  officeId: number | null;
  currencyCode: string | null;
  businessDate: string;
  includeClients: boolean;
  includeLoans: boolean;
  includeSavings: boolean;
  includeReports: boolean;
  includeCollections: boolean;
  includeCheckerInbox: boolean;
  includeCashier: boolean;
  userId: number;
  userOfficeId: number;
}
