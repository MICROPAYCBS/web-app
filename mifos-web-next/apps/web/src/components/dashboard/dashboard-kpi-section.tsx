'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Inbox,
  PiggyBank,
  TrendingUp,
  Users,
  UserCheck,
  Wallet
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { DashboardKpiSectionSkeleton } from '@/components/dashboard/dashboard-skeleton';
import {
  DashboardKpiCustomizeButton,
  DashboardKpiCustomizer,
  useDashboardKpiWidgetPreferences
} from '@/components/dashboard/dashboard-kpi-customizer';
import { Button } from '@/components/ui/button';
import {
  DASHBOARD_KPI_WIDGETS,
  DEFAULT_VISIBLE_DASHBOARD_KPI_WIDGETS,
  DASHBOARD_KPI_WIDGET_STORAGE_KEY,
  resolveDashboardKpiWidgetHref,
  resolveDashboardKpiWidgetValue
} from '@/lib/dashboard/dashboard-kpi-widgets';
import type {
  DashboardKpiWidgetDefinition,
  DashboardKpiWidgetId,
  DashboardKpis
} from '@/lib/dashboard/dashboard-kpi-types';
import { cn } from '@/lib/utils';

const WIDGET_ICONS = {
  all_customers: Users,
  active_customers: UserCheck,
  active_loans: Banknote,
  pending_approval: ClipboardList,
  pending_disbursal: CheckCircle2,
  disbursed_today: TrendingUp,
  disbursed_this_month: CalendarClock,
  expected_collections: Banknote,
  loans_in_arrears: AlertTriangle,
  portfolio_at_risk: AlertTriangle,
  savings_accounts: PiggyBank,
  checker_pending: Inbox,
  cashier_balance: Wallet
} satisfies Partial<Record<DashboardKpiWidgetId, typeof Users>>;

export function DashboardKpiSection({
  officeId,
  currencyCode,
  initialKpis,
  permissions,
  filtersSlot,
  className
}: {
  officeId: string;
  currencyCode: string;
  initialKpis: DashboardKpis;
  permissions: {
    clients: boolean;
    loans: boolean;
    savings: boolean;
    reports: boolean;
    checker: boolean;
    collections: boolean;
    cashier: boolean;
  };
  filtersSlot?: ReactNode;
  className?: string;
}) {
  const [kpis, setKpis] = useState(initialKpis);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [hasFetchedKpis, setHasFetchedKpis] = useState(false);
  const [pending, startTransition] = useTransition();

  const loadKpis = useCallback((nextOfficeId: string, nextCurrencyCode: string) => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (nextOfficeId.trim()) {
          params.set('officeId', nextOfficeId);
        }
        if (nextCurrencyCode.trim()) {
          params.set('currencyCode', nextCurrencyCode);
        }
        const query = params.toString();
        const res = await fetch(query ? `/api/dashboard/kpis?${query}` : '/api/dashboard/kpis', {
          credentials: 'include'
        });
        if (res.ok) {
          const json = (await res.json()) as DashboardKpis;
          setKpis(json);
        }
      } finally {
        setHasFetchedKpis(true);
      }
    });
  }, []);

  useEffect(() => {
    loadKpis(officeId, currencyCode);
  }, [currencyCode, loadKpis, officeId]);

  const availableWidgets = useMemo(
    () =>
      DASHBOARD_KPI_WIDGETS.filter((widget) => {
        if (!widget.permission) {
          return true;
        }
        return permissions[widget.permission];
      }),
    [permissions]
  );

  const defaultVisibleForUser = useMemo(
    () =>
      DEFAULT_VISIBLE_DASHBOARD_KPI_WIDGETS.filter((id) =>
        availableWidgets.some((widget) => widget.id === id)
      ),
    [availableWidgets]
  );

  const { visibleIds, isLoaded, toggleWidget, resetWidgets } = useDashboardKpiWidgetPreferences(
    defaultVisibleForUser,
    DASHBOARD_KPI_WIDGET_STORAGE_KEY
  );

  const widgetGroups = useMemo(() => {
    const categories = ['customers', 'loans', 'collections', 'savings', 'operations'] as const;
    return categories
      .map((category) => ({
        category,
        widgetIds: availableWidgets
          .filter((widget) => widget.category === category)
          .map((widget) => widget.id)
      }))
      .filter((group) => group.widgetIds.length > 0);
  }, [availableWidgets]);

  const widgetLabels = useMemo(
    () =>
      Object.fromEntries(availableWidgets.map((widget) => [widget.id, widget.title])) as Record<
        string,
        string
      >,
    [availableWidgets]
  );

  const activeWidgets = availableWidgets.filter((widget) => visibleIds.has(widget.id));
  const skeletonCardCount = Math.max(defaultVisibleForUser.length, 4);
  const showSkeleton = !isLoaded || (pending && !hasFetchedKpis);

  if (showSkeleton) {
    return (
      <section
        className={cn('space-y-4', className)}
        aria-busy
        aria-label="Loading dashboard metrics"
      >
        <DashboardKpiSectionSkeleton cardCount={skeletonCardCount} />
      </section>
    );
  }

  return (
    <section className={cn('space-y-4', className)}>
      {filtersSlot ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {filtersSlot}
          <div className="flex flex-wrap items-center gap-2">
            <DashboardKpiCustomizeButton onClick={() => setCustomizerOpen(true)} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => loadKpis(officeId, currencyCode)}
            >
              Refresh
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DashboardKpiCustomizeButton onClick={() => setCustomizerOpen(true)} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => loadKpis(officeId, currencyCode)}
          >
            Refresh
          </Button>
        </div>
      )}

      {activeWidgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 *:h-full *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {activeWidgets.map((widget) => (
            <DashboardKpiWidgetCard
              key={widget.id}
              widget={widget}
              kpis={kpis}
              loading={pending}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No KPI widgets selected.</p>
          <Button
            type="button"
            variant="link"
            className="mt-2"
            onClick={() => setCustomizerOpen(true)}
          >
            Customize dashboard
          </Button>
        </div>
      )}

      <DashboardKpiCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        groups={widgetGroups}
        widgetLabels={widgetLabels}
        visibleIds={visibleIds}
        onToggle={toggleWidget}
        onReset={resetWidgets}
      />
    </section>
  );
}

const MONEY_KPI_WIDGETS = new Set<DashboardKpiWidgetId>([
  'disbursed_today',
  'disbursed_this_month',
  'expected_collections',
  'cashier_balance'
]);

function DashboardKpiWidgetCard({
  widget,
  kpis,
  loading
}: {
  widget: DashboardKpiWidgetDefinition;
  kpis: DashboardKpis;
  loading: boolean;
}) {
  const resolved = resolveDashboardKpiWidgetValue(widget.id, kpis);
  if (!resolved && !loading) {
    return null;
  }

  const Icon = WIDGET_ICONS[widget.id];

  return (
    <DashboardStatCard
      title={widget.title}
      value={resolved?.value ?? '—'}
      description={resolved?.description ?? widget.description}
      icon={Icon}
      variant={widget.variant}
      valueKind={MONEY_KPI_WIDGETS.has(widget.id) ? 'money' : 'count'}
      href={resolveDashboardKpiWidgetHref(widget.id, kpis, widget.href)}
      loading={loading && !resolved}
    />
  );
}
