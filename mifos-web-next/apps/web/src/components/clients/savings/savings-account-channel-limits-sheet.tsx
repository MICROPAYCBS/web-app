'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsAccountChannelLimit, SavingsChannelLimitDirection } from '@mifos/api-client';
import { channelLimitCustomerSaveErrors, formatActionErrorMessage } from '@mifos/validation';
import { useEffect, useState, useTransition } from 'react';
import {
  loadSavingsAccountChannelLimitsAction,
  updateSavingsAccountChannelLimitAction
} from '@/actions/savings-account-command';
import { DOCKED_SHEET_LAYOUT_CLASSNAME } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { cn } from '@/lib/utils';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import {
  formatChannelCap,
  formatChannelRemaining,
  formatChannelUsage,
  formatPendingEffectiveOn
} from '@/lib/fineract/savings-channel-limits';

const CUSTOMER_FIELDS = [
  'maxPerTxn',
  'maxPerDay',
  'maxPerMonth',
  'maxCountPerDay',
  'maxCountPerMonth'
] as const;

type CustomerField = (typeof CUSTOMER_FIELDS)[number];

const DIMENSIONS: {
  field: CustomerField;
  label: string;
  kind: 'amount' | 'count';
  ceiling: keyof SavingsAccountChannelLimit;
  effective: keyof SavingsAccountChannelLimit;
  pending: keyof SavingsAccountChannelLimit;
  used?: keyof SavingsAccountChannelLimit;
  remaining?: keyof SavingsAccountChannelLimit;
  usedLabel?: string;
  remainingLabel?: string;
}[] = [
  {
    field: 'maxPerTxn',
    label: 'Per transaction',
    kind: 'amount',
    ceiling: 'ceilingPerTxn',
    effective: 'effectivePerTxn',
    pending: 'pendingMaxPerTxn'
  },
  {
    field: 'maxPerDay',
    label: 'Per day',
    kind: 'amount',
    ceiling: 'ceilingPerDay',
    effective: 'effectivePerDay',
    pending: 'pendingMaxPerDay',
    used: 'usedToday',
    remaining: 'remainingToday',
    usedLabel: 'Used today',
    remainingLabel: 'Remaining today'
  },
  {
    field: 'maxPerMonth',
    label: 'Per month',
    kind: 'amount',
    ceiling: 'ceilingPerMonth',
    effective: 'effectivePerMonth',
    pending: 'pendingMaxPerMonth',
    used: 'usedThisMonth',
    remaining: 'remainingThisMonth',
    usedLabel: 'Used this month',
    remainingLabel: 'Remaining this month'
  },
  {
    field: 'maxCountPerDay',
    label: 'Count per day',
    kind: 'count',
    ceiling: 'ceilingCountPerDay',
    effective: 'effectiveCountPerDay',
    pending: 'pendingMaxCountPerDay',
    used: 'countToday',
    remaining: 'remainingCountToday',
    usedLabel: 'Count today',
    remainingLabel: 'Remaining today'
  },
  {
    field: 'maxCountPerMonth',
    label: 'Count per month',
    kind: 'count',
    ceiling: 'ceilingCountPerMonth',
    effective: 'effectiveCountPerMonth',
    pending: 'pendingMaxCountPerMonth',
    used: 'countThisMonth',
    remaining: 'remainingCountThisMonth',
    usedLabel: 'Count this month',
    remainingLabel: 'Remaining this month'
  }
];

type DraftValues = Record<CustomerField, string>;

function emptyDraft(): DraftValues {
  return {
    maxPerTxn: '',
    maxPerDay: '',
    maxPerMonth: '',
    maxCountPerDay: '',
    maxCountPerMonth: ''
  };
}

function draftFromLimit(limit: SavingsAccountChannelLimit): DraftValues {
  const draft = emptyDraft();
  for (const field of CUSTOMER_FIELDS) {
    const value = limit[field];
    draft[field] = typeof value === 'number' ? String(value) : '';
  }
  return draft;
}

function numberOrNull(raw: string): number | null {
  if (!raw.trim()) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function capNumber(limit: SavingsAccountChannelLimit, key: keyof SavingsAccountChannelLimit): number | null {
  const value = limit[key];
  return typeof value === 'number' ? value : null;
}

function DirectionLimits({
  limit,
  currencyCode,
  canUpdate,
  values,
  errors,
  onChange
}: {
  limit: SavingsAccountChannelLimit;
  currencyCode: string;
  canUpdate: boolean;
  values: DraftValues;
  errors: Record<string, string>;
  onChange: (field: CustomerField, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Leave a customer value blank to use the bank ceiling. Zero blocks that dimension. The cap
        in force must still run from each transaction, to the day, to the month. A decrease
        applies now. An increase may wait until the date shown below.
      </p>
      {limit.pendingEffectiveOn ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          A change is waiting until {formatPendingEffectiveOn(limit.pendingEffectiveOn)}. The
          values in force stay as they are until then.
        </p>
      ) : null}
      {DIMENSIONS.map((dimension) => {
        const pendingValue = capNumber(limit, dimension.pending);
        return (
          <div key={dimension.field} className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">{dimension.label}</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Bank ceiling</dt>
                <dd>
                  {formatChannelCap(
                    capNumber(limit, dimension.ceiling),
                    dimension.kind,
                    currencyCode
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">In force</dt>
                <dd>
                  {formatChannelCap(
                    capNumber(limit, dimension.effective),
                    dimension.kind,
                    currencyCode
                  )}
                </dd>
              </div>
              {dimension.used && dimension.usedLabel ? (
                <div>
                  <dt className="text-muted-foreground">{dimension.usedLabel}</dt>
                  <dd>
                    {formatChannelUsage(
                      capNumber(limit, dimension.used),
                      dimension.kind,
                      currencyCode
                    )}
                  </dd>
                </div>
              ) : null}
              {dimension.remaining && dimension.remainingLabel ? (
                <div>
                  <dt className="text-muted-foreground">{dimension.remainingLabel}</dt>
                  <dd>
                    {formatChannelRemaining(
                      capNumber(limit, dimension.remaining),
                      dimension.kind,
                      currencyCode
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
            {limit.pendingEffectiveOn ? (
              <p className="text-sm text-muted-foreground">
                Waiting:{' '}
                {pendingValue == null
                  ? 'Use the ceiling'
                  : formatChannelCap(pendingValue, dimension.kind, currencyCode)}
              </p>
            ) : null}
            {canUpdate ? (
              dimension.kind === 'count' ? (
                <NumericField
                  id={`${limit.direction}-${dimension.field}`}
                  label="Customer limit"
                  optional
                  integer
                  value={values[dimension.field]}
                  onChange={(value) => onChange(dimension.field, value)}
                  error={errors[dimension.field]}
                  placeholder="Use the ceiling"
                />
              ) : (
                <MoneyField
                  id={`${limit.direction}-${dimension.field}`}
                  label="Customer limit"
                  optional
                  currencyCode={currencyCode}
                  value={values[dimension.field]}
                  onChange={(value) => onChange(dimension.field, value)}
                  error={errors[dimension.field]}
                  placeholder="Use the ceiling"
                />
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function SavingsAccountChannelLimitsSheet({
  clientId,
  accountId,
  productPaymentChannelId,
  channelName,
  currencyCode,
  canUpdate,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  productPaymentChannelId?: number;
  channelName: string;
  currencyCode: string;
  canUpdate: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [limits, setLimits] = useState<SavingsAccountChannelLimit[]>([]);
  const [drafts, setDrafts] = useState<Partial<Record<SavingsChannelLimitDirection, DraftValues>>>({});
  const [errors, setErrors] = useState<
    Partial<Record<SavingsChannelLimitDirection, Record<string, string>>>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<SavingsChannelLimitDirection>('DEBIT');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || productPaymentChannelId == null) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void loadSavingsAccountChannelLimitsAction(String(accountId), productPaymentChannelId).then(
      (result) => {
        if (cancelled) {
          return;
        }
        setLoading(false);
        if (!result.ok) {
          setLimits([]);
          setLoadError(result.message);
          return;
        }
        setLimits(result.limits);
        const next: Partial<Record<SavingsChannelLimitDirection, DraftValues>> = {};
        for (const limit of result.limits) {
          next[limit.direction] = draftFromLimit(limit);
        }
        setDrafts(next);
        setErrors({});
      }
    );
    return () => {
      cancelled = true;
    };
  }, [accountId, open, productPaymentChannelId]);

  function save(limit: SavingsAccountChannelLimit) {
    const values = drafts[limit.direction] ?? emptyDraft();
    const parsed = {
      maxPerTxn: numberOrNull(values.maxPerTxn),
      maxPerDay: numberOrNull(values.maxPerDay),
      maxPerMonth: numberOrNull(values.maxPerMonth),
      maxCountPerDay: numberOrNull(values.maxCountPerDay),
      maxCountPerMonth: numberOrNull(values.maxCountPerMonth)
    };
    const fieldErrors: Record<string, string> = {};
    for (const field of CUSTOMER_FIELDS) {
      const value = parsed[field];
      if (typeof value === 'number' && Number.isNaN(value)) {
        fieldErrors[field] = 'Enter zero or a greater amount.';
      }
    }
    const limitErrors = channelLimitCustomerSaveErrors({
      values: {
        maxPerTxn: Number.isNaN(parsed.maxPerTxn) ? null : parsed.maxPerTxn,
        maxPerDay: Number.isNaN(parsed.maxPerDay) ? null : parsed.maxPerDay,
        maxPerMonth: Number.isNaN(parsed.maxPerMonth) ? null : parsed.maxPerMonth,
        maxCountPerDay: Number.isNaN(parsed.maxCountPerDay) ? null : parsed.maxCountPerDay,
        maxCountPerMonth: Number.isNaN(parsed.maxCountPerMonth) ? null : parsed.maxCountPerMonth
      },
      ceilings: {
        maxPerTxn: limit.ceilingPerTxn,
        maxPerDay: limit.ceilingPerDay,
        maxPerMonth: limit.ceilingPerMonth,
        maxCountPerDay: limit.ceilingCountPerDay,
        maxCountPerMonth: limit.ceilingCountPerMonth
      }
    });
    const combined = { ...limitErrors, ...fieldErrors };
    if (Object.keys(combined).length > 0 || productPaymentChannelId == null) {
      setErrors((current) => ({ ...current, [limit.direction]: combined }));
      return;
    }
    setErrors((current) => ({ ...current, [limit.direction]: {} }));
    startTransition(async () => {
      const result = await updateSavingsAccountChannelLimitAction(
        clientId,
        String(accountId),
        productPaymentChannelId,
        {
          paymentTypeId: limit.paymentTypeId,
          direction: limit.direction,
          maxPerTxn: parsed.maxPerTxn,
          maxPerDay: parsed.maxPerDay,
          maxPerMonth: parsed.maxPerMonth,
          maxCountPerDay: parsed.maxCountPerDay,
          maxCountPerMonth: parsed.maxCountPerMonth,
          locale: FINERACT_LOCALE
        }
      );
      if (!result.ok) {
        setErrors((current) => ({
          ...current,
          [limit.direction]: {
            ...result.fieldErrors,
            _form: formatActionErrorMessage(result.message, result.fieldErrors)
          }
        }));
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Channel limits saved.',
        pending: 'Sent for approval. The limits stay unchanged until it is approved.'
      });
      if (result.limits) {
        setLimits(result.limits);
        const next: Partial<Record<SavingsChannelLimitDirection, DraftValues>> = {};
        for (const row of result.limits) {
          next[row.direction] = draftFromLimit(row);
        }
        setDrafts(next);
      }
    });
  }

  const debit = limits.find((limit) => limit.direction === 'DEBIT');
  const credit = limits.find((limit) => limit.direction === 'CREDIT');
  const activeLimit = direction === 'DEBIT' ? debit : credit;
  const activeError = errors[direction]?._form;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <SheetContent
        side="right"
        showCloseButton
        className={cn(
          DOCKED_SHEET_LAYOUT_CLASSNAME,
          'data-[side=right]:w-full data-[side=right]:sm:max-w-lg'
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>Limits · {channelName}</SheetTitle>
          <SheetDescription>
            The cap in force is the lower of the bank ceiling and the customer choice. Usage is
            for today and this calendar month.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {productPaymentChannelId == null ? (
            <p className="text-sm text-muted-foreground">Limits for this channel are not available.</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading limits…</p>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : (
            <Tabs
              value={direction}
              onValueChange={(value) => setDirection(value as SavingsChannelLimitDirection)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="DEBIT">Debit</TabsTrigger>
                <TabsTrigger value="CREDIT">Credit</TabsTrigger>
              </TabsList>
              {activeError ? (
                <p className="mt-4 text-sm text-destructive">{activeError}</p>
              ) : null}
              <TabsContent value="DEBIT" className="mt-4">
                {debit && drafts.DEBIT ? (
                  <DirectionLimits
                    limit={debit}
                    currencyCode={currencyCode}
                    canUpdate={canUpdate}
                    values={drafts.DEBIT}
                    errors={errors.DEBIT ?? {}}
                    onChange={(field, value) =>
                      setDrafts((current) => ({
                        ...current,
                        DEBIT: { ...(current.DEBIT ?? emptyDraft()), [field]: value }
                      }))
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No debit limits were returned.</p>
                )}
              </TabsContent>
              <TabsContent value="CREDIT" className="mt-4">
                {credit && drafts.CREDIT ? (
                  <DirectionLimits
                    limit={credit}
                    currencyCode={currencyCode}
                    canUpdate={canUpdate}
                    values={drafts.CREDIT}
                    errors={errors.CREDIT ?? {}}
                    onChange={(field, value) =>
                      setDrafts((current) => ({
                        ...current,
                        CREDIT: { ...(current.CREDIT ?? emptyDraft()), [field]: value }
                      }))
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No credit limits were returned.</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {canUpdate ? 'Cancel' : 'Close'}
          </Button>
          {canUpdate ? (
            <Button
              type="button"
              disabled={pending || loading || activeLimit == null || productPaymentChannelId == null}
              onClick={() => {
                if (activeLimit) {
                  save(activeLimit);
                }
              }}
            >
              {pending ? 'Saving…' : 'Save'}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
