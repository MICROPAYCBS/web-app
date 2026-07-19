'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { DashboardKpiVariant } from '@/lib/dashboard/dashboard-kpi-types';
import { cn } from '@/lib/utils';

const VARIANT_CLASS: Record<DashboardKpiVariant, string> = {
  default: 'border-border bg-card',
  primary: 'border-primary/20 bg-primary/5',
  success: 'border-emerald-500/20 bg-emerald-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  destructive: 'border-destructive/25 bg-destructive/5'
};

function resolveValueTypography(value: string, valueKind: 'count' | 'money'): string {
  if (valueKind === 'money' && value.length > 12) {
    return 'text-lg leading-tight @[260px]/card:text-xl @[340px]/card:text-2xl';
  }

  return 'text-xl leading-tight @[260px]/card:text-2xl @[340px]/card:text-3xl';
}

export function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
  valueKind = 'count',
  href,
  loading = false
}: {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  variant?: DashboardKpiVariant;
  valueKind?: 'count' | 'money';
  href?: string;
  loading?: boolean;
}) {
  const displayValue = loading ? '…' : value;

  const card = (
    <Card
      className={cn(
        '@container/card flex h-full flex-col gap-0 py-0 shadow-sm',
        VARIANT_CLASS[variant],
        href && 'transition-colors hover:bg-muted/40'
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <p className="min-w-0 text-sm font-medium leading-snug text-muted-foreground">{title}</p>
        {Icon ? (
          <div className="shrink-0 rounded-md bg-background p-2 ring-1 ring-border/60">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
          </div>
        ) : null}
      </div>

      <CardContent className="flex flex-1 flex-col justify-center px-4 pb-3 pt-3">
        <p
          className={cn(
            'min-w-0 font-semibold tabular-nums tracking-tight [overflow-wrap:anywhere]',
            resolveValueTypography(displayValue, valueKind)
          )}
          title={displayValue}
        >
          {displayValue}
        </p>
      </CardContent>

      {description ? (
        <CardFooter className="mt-auto flex-col items-start gap-1 border-t bg-muted/50 px-4 py-3 text-xs">
          <p className="line-clamp-2 text-muted-foreground">{description}</p>
        </CardFooter>
      ) : null}
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {card}
      </Link>
    );
  }

  return card;
}
