'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { BUSINESS_DATE_TYPE, COB_DATE_TYPE } from '@mifos/api-client';
import { AlertTriangle, Calendar, Clock, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateBusinessDateAction } from '@/actions/business-date';
import { DateField } from '@/components/composites/date-field';
import { ListPage } from '@/components/composites/list-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BusinessDatePageSnapshot } from '@/lib/fineract/business-date';
import {
  businessDateNotTodayBadgeLabel,
  businessDateNotTodayDescription,
  isBusinessDateNotToday
} from '@/lib/fineract/business-date-context';
import { formatFineractDateArray, parseFineractDateString } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

const MIN_DATE = new Date(2000, 0, 1);
const MAX_DATE = new Date(2100, 0, 1);

type EditableDateType = typeof BUSINESS_DATE_TYPE | typeof COB_DATE_TYPE;

function formatDisplayDate(value: string | undefined): string {
  if (!value?.trim()) {
    return '—';
  }
  const parsed = parseFineractDateString(value);
  if (!parsed) {
    return value;
  }
  return formatFineractDateArray([parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()]) ?? value;
}

function BusinessDateRow({
  label,
  description,
  icon: Icon,
  dateType,
  value,
  canUpdate,
  dateFormat,
  highlightWhenNotToday = false
}: {
  label: string;
  description: string;
  icon: typeof Calendar;
  dateType: EditableDateType;
  value?: string;
  canUpdate: boolean;
  dateFormat: string;
  highlightWhenNotToday?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [pending, startTransition] = useTransition();
  const isNotToday = highlightWhenNotToday && isBusinessDateNotToday(value);

  function startEdit() {
    setDraft(value ?? '');
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(value ?? '');
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateBusinessDateAction({ type: dateType, date: draft });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`${label} updated.`);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 border-b border-border py-4 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              'size-4 shrink-0',
              isNotToday ? 'text-warning' : 'text-muted-foreground'
            )}
            aria-hidden
          />
          <p className="font-medium">{label}</p>
          {isNotToday ? (
            <Badge
              variant="outline"
              className="border-warning/40 bg-warning/10 text-warning-foreground"
            >
              <AlertTriangle className="size-3" aria-hidden />
              {businessDateNotTodayBadgeLabel()}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:min-w-[18rem] sm:items-end">
        {editing ? (
          <>
            <DateField
              id={`business-date-${dateType}`}
              label={label}
              required
              value={draft}
              onChange={(next) => setDraft(next ?? '')}
              dateFormat={dateFormat}
              allowFuture
              fromDate={MIN_DATE}
              toDate={MAX_DATE}
              disabled={pending}
              className="w-full sm:min-w-[18rem]"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={cancelEdit} disabled={pending}>
                <X className="mr-2 size-4" aria-hidden />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={pending || !draft.trim() || draft === value}
              >
                {pending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col items-end gap-2 sm:w-auto sm:min-w-[18rem]">
            <div className="flex w-full items-center justify-between gap-3 sm:justify-end">
              <Badge
                variant="secondary"
                className={cn(
                  'tabular-nums',
                  isNotToday && 'border-warning/40 bg-warning/10 text-warning-foreground'
                )}
              >
                {formatDisplayDate(value)}
              </Badge>
              {canUpdate ? (
                <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="mr-2 size-4" aria-hidden />
                  Edit
                </Button>
              ) : null}
            </div>
            {isNotToday ? (
              <p className="text-xs text-warning-foreground sm:text-right">
                {businessDateNotTodayDescription()}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function BusinessDatePageContent({
  snapshot,
  canUpdate
}: {
  snapshot: BusinessDatePageSnapshot;
  canUpdate: boolean;
}) {
  const businessDateIsNotToday = isBusinessDateNotToday(snapshot.businessDate);

  return (
    <ListPage
      title="Business date"
      description="View and adjust the organisation business date and close-of-business date when enabled."
    >
      {snapshot.enabled && businessDateIsNotToday ? (
        <div
          className="mb-4 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground"
          role="status"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{businessDateNotTodayDescription()}</p>
        </div>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Organisation dates</CardTitle>
            <Badge variant="outline" className="font-mono text-[11px] font-normal">
              {snapshot.configurationName}
            </Badge>
          </div>
          <CardDescription>
            Date format: <span className="font-medium text-foreground">{snapshot.dateFormat}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {!snapshot.enabled ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Business date functionality is not enabled for this server.</p>
              <p>
                Turn on the business date setting in{' '}
                <Link href="/system/configurations" className="text-primary underline-offset-4 hover:underline">
                  Global configurations
                </Link>{' '}
                to manage organisation dates here.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              <BusinessDateRow
                label="Business date"
                description="The organisation's current business day used for transactions and batch processing."
                icon={Calendar}
                dateType={BUSINESS_DATE_TYPE}
                value={snapshot.businessDate}
                canUpdate={canUpdate}
                dateFormat={snapshot.dateFormat}
                highlightWhenNotToday
              />
              <BusinessDateRow
                label="COB date"
                description="The close-of-business date tracked alongside scheduled COB jobs."
                icon={Clock}
                dateType={COB_DATE_TYPE}
                value={snapshot.cobDate}
                canUpdate={canUpdate}
                dateFormat={snapshot.dateFormat}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </ListPage>
  );
}
