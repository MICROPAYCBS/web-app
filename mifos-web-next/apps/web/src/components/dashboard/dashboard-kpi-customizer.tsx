'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { RotateCcw, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  DOCKED_SHEET_LAYOUT_CLASSNAME,
  dockedSheetSideMaxWidth
} from '@/components/composites/form-sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS = {
  customers: 'Customers',
  loans: 'Loans',
  collections: 'Collections',
  savings: 'Savings',
  operations: 'Operations'
} as const;

export function DashboardKpiCustomizer({
  open,
  onOpenChange,
  groups,
  widgetLabels,
  visibleIds,
  onToggle,
  onReset
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: { category: keyof typeof CATEGORY_LABELS; widgetIds: string[] }[];
  widgetLabels: Record<string, string>;
  visibleIds: Set<string>;
  onToggle: (widgetId: string) => void;
  onReset: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(DOCKED_SHEET_LAYOUT_CLASSNAME, dockedSheetSideMaxWidth.right, 'sm:max-w-md')}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-border pr-10">
          <SheetTitle>Customize dashboard</SheetTitle>
          <SheetDescription>
            Choose which KPI cards appear on your dashboard. Changes save automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4">
          <div>
            <p className="text-sm font-medium">Visible widgets</p>
            <p className="text-xs text-muted-foreground">{visibleIds.size} selected</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="mr-2 size-3.5" aria-hidden />
            Reset
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-6 px-4 py-4">
            {groups.map((group) => (
              <div key={group.category} className="space-y-3">
                <h3 className="text-sm font-medium">{CATEGORY_LABELS[group.category]}</h3>
                <div className="space-y-2">
                  {group.widgetIds.map((widgetId) => (
                    <div
                      key={widgetId}
                      className="flex items-center gap-3 rounded-md border px-3 py-2.5"
                    >
                      <Checkbox
                        id={`dashboard-widget-${widgetId}`}
                        checked={visibleIds.has(widgetId)}
                        onCheckedChange={() => onToggle(widgetId)}
                      />
                      <Label
                        htmlFor={`dashboard-widget-${widgetId}`}
                        className="flex-1 text-sm font-normal leading-snug"
                      >
                        {widgetLabels[widgetId] ?? widgetId}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DashboardKpiCustomizeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <Settings2 className="size-4 md:mr-2" aria-hidden />
      <span className="hidden md:inline">Customize</span>
    </Button>
  );
}

export function useDashboardKpiWidgetPreferences(
  defaultVisibleIds: string[],
  storageKey: string
): {
  visibleIds: Set<string>;
  isLoaded: boolean;
  toggleWidget: (widgetId: string) => void;
  resetWidgets: () => void;
} {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set(defaultVisibleIds));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setVisibleIds(new Set(parsed.filter((item): item is string => typeof item === 'string')));
        }
      }
    } catch {
      // Keep defaults.
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify([...visibleIds]));
  }, [isLoaded, storageKey, visibleIds]);

  function toggleWidget(widgetId: string) {
    setVisibleIds((current) => {
      const next = new Set(current);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  }

  function resetWidgets() {
    setVisibleIds(new Set(defaultVisibleIds));
  }

  return { visibleIds, isLoaded, toggleWidget, resetWidgets };
}
