/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DashboardKpiWidgetDefinition,
  DashboardKpiWidgetId,
  DashboardKpis
} from '@/lib/dashboard/dashboard-kpi-types';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { tellerCashierDetailPath } from '@/lib/fineract/teller-paths';

export const DASHBOARD_KPI_WIDGETS: DashboardKpiWidgetDefinition[] = [
  {
    id: 'all_customers',
    title: 'Customers',
    description: 'Customers in this branch',
    category: 'customers',
    variant: 'default',
    href: '/clients',
    permission: 'clients'
  },
  {
    id: 'active_customers',
    title: 'Active customers',
    description: 'Currently active customers',
    category: 'customers',
    variant: 'primary',
    href: '/clients',
    permission: 'clients'
  },
  {
    id: 'active_loans',
    title: 'Active loans',
    description: 'Loans currently active',
    category: 'loans',
    variant: 'default',
    href: '/loans',
    permission: 'loans'
  },
  {
    id: 'pending_approval',
    title: 'Loans pending approval',
    description: 'Submitted loan applications awaiting approval',
    category: 'loans',
    variant: 'warning',
    href: '/loans?status=100',
    permission: 'loans'
  },
  {
    id: 'pending_disbursal',
    title: 'Loans pending disbursal',
    description: 'Approved loans awaiting disbursement',
    category: 'loans',
    variant: 'warning',
    href: '/loans?status=200',
    permission: 'loans'
  },
  {
    id: 'disbursed_today',
    title: 'Disbursed today',
    description: 'Principal disbursed on the business date',
    category: 'loans',
    variant: 'primary',
    href: '/loans',
    permission: 'reports'
  },
  {
    id: 'disbursed_this_month',
    title: 'Disbursed this month',
    description: 'Principal disbursed since month start',
    category: 'loans',
    variant: 'default',
    href: '/loans',
    permission: 'reports'
  },
  {
    id: 'expected_collections',
    title: 'Expected collections',
    description: 'Repayments due on the business date',
    category: 'collections',
    variant: 'primary',
    href: '/collections/collection-sheet',
    permission: 'collections'
  },
  {
    id: 'loans_in_arrears',
    title: 'Loans in arrears',
    description: 'Active loans with overdue installments',
    category: 'loans',
    variant: 'destructive',
    href: '/loans',
    permission: 'reports'
  },
  {
    id: 'portfolio_at_risk',
    title: 'Portfolio at risk',
    description: 'PAR 30 (principal overdue / outstanding)',
    category: 'loans',
    variant: 'destructive',
    href: '/reports',
    permission: 'reports'
  },
  {
    id: 'savings_accounts',
    title: 'Savings accounts',
    description: 'Savings accounts in scope',
    category: 'savings',
    variant: 'success',
    href: '/savings',
    permission: 'savings'
  },
  {
    id: 'checker_pending',
    title: 'Checker inbox',
    description: 'Submissions waiting for your review',
    category: 'operations',
    variant: 'warning',
    href: '/checker-inbox-and-tasks',
    permission: 'checker'
  },
  {
    id: 'cashier_balance',
    title: 'My cashier',
    description: 'Net cash in your assigned drawer',
    category: 'operations',
    variant: 'success',
    permission: 'cashier'
  }
];

export const DEFAULT_VISIBLE_DASHBOARD_KPI_WIDGETS: DashboardKpiWidgetId[] = [
  'all_customers',
  'active_customers',
  'active_loans',
  'pending_approval',
  'pending_disbursal',
  'expected_collections',
  'disbursed_today',
  'loans_in_arrears',
  'savings_accounts',
  'cashier_balance',
  'checker_pending'
];

export const DASHBOARD_KPI_WIDGET_STORAGE_KEY = 'dashboard_kpi_widgets_v2';

export function resolveDashboardKpiWidgetHref(
  widgetId: DashboardKpiWidgetId,
  kpis: DashboardKpis,
  definitionHref?: string
): string | undefined {
  if (widgetId === 'cashier_balance' && kpis.cashier) {
    return kpis.cashier.canOpenDetail
      ? tellerCashierDetailPath(kpis.cashier.tellerId, kpis.cashier.cashierId)
      : undefined;
  }
  return definitionHref;
}

export function resolveDashboardKpiWidgetValue(
  widgetId: DashboardKpiWidgetId,
  kpis: DashboardKpis
): { value: string; description?: string } | null {
  const currencyCode = kpis.currencyCode ?? undefined;

  switch (widgetId) {
    case 'all_customers':
      return kpis.customers.total != null
        ? { value: kpis.customers.total.toLocaleString(), description: 'Customers in this branch' }
        : null;
    case 'active_customers':
      return kpis.customers.active != null
        ? { value: kpis.customers.active.toLocaleString(), description: 'Active customers' }
        : null;
    case 'active_loans':
      return kpis.loans.active != null
        ? { value: kpis.loans.active.toLocaleString(), description: 'Active loan accounts' }
        : null;
    case 'pending_approval':
      return kpis.loans.pendingApproval != null
        ? {
            value: kpis.loans.pendingApproval.toLocaleString(),
            description: 'Loan applications awaiting approval'
          }
        : null;
    case 'pending_disbursal':
      return kpis.loans.pendingDisbursal != null
        ? {
            value: kpis.loans.pendingDisbursal.toLocaleString(),
            description: 'Approved loans awaiting disbursement'
          }
        : null;
    case 'disbursed_today':
      return kpis.loans.disbursedTodayAmount != null
        ? {
            value: formatAccountMoney(kpis.loans.disbursedTodayAmount, currencyCode),
            description: 'On business date'
          }
        : null;
    case 'disbursed_this_month':
      return kpis.loans.disbursedMonthAmount != null
        ? {
            value: formatAccountMoney(kpis.loans.disbursedMonthAmount, currencyCode),
            description: 'Month to date'
          }
        : null;
    case 'expected_collections':
      return kpis.collections.expectedAmount != null
        ? {
            value: formatAccountMoney(kpis.collections.expectedAmount, currencyCode),
            description:
              kpis.collections.expectedLoanCount != null
                ? `${kpis.collections.expectedLoanCount.toLocaleString()} loan repayments due`
                : 'Due on business date'
          }
        : null;
    case 'loans_in_arrears':
      return kpis.loans.inArrears != null
        ? { value: kpis.loans.inArrears.toLocaleString(), description: 'Loans in arrears' }
        : null;
    case 'portfolio_at_risk':
      return kpis.loans.portfolioAtRiskPercent != null
        ? {
            value: `${kpis.loans.portfolioAtRiskPercent.toFixed(1)}%`,
            description: 'PAR 30'
          }
        : null;
    case 'savings_accounts':
      return kpis.savings.total != null
        ? { value: kpis.savings.total.toLocaleString(), description: 'Savings accounts' }
        : null;
    case 'checker_pending':
      return kpis.checkerInboxPending != null
        ? {
            value: kpis.checkerInboxPending.toLocaleString(),
            description: 'Tasks in checker inbox'
          }
        : null;
    case 'cashier_balance':
      return kpis.cashier
        ? { value: kpis.cashier.label, description: 'Net cash in drawer' }
        : null;
    default:
      return null;
  }
}
