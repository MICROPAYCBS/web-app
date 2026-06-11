'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FloatingRatePeriodInput } from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createFloatingRateAction,
  updateFloatingRateAction
} from '@/actions/floating-rate';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { FloatingRatePeriodsEditor } from '@/components/products/floating-rate/floating-rate-periods-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  floatingRateDetailPath,
  floatingRatesListPath
} from '@/lib/fineract/floating-rate-paths';
import { cn } from '@/lib/utils';

export function FloatingRateFormPage({
  mode,
  floatingRateId,
  initialName,
  initialIsBaseLendingRate,
  initialIsActive,
  initialPeriods
}: {
  mode: 'create' | 'edit';
  floatingRateId?: number;
  initialName?: string;
  initialIsBaseLendingRate?: boolean;
  initialIsActive?: boolean;
  initialPeriods?: FloatingRatePeriodInput[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName ?? '');
  const [isBaseLendingRate, setIsBaseLendingRate] = useState(initialIsBaseLendingRate ?? false);
  const [isActive, setIsActive] = useState(initialIsActive ?? false);
  const [periods, setPeriods] = useState<FloatingRatePeriodInput[]>(initialPeriods ?? []);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const payload = {
      name,
      isBaseLendingRate,
      isActive,
      ratePeriods: periods
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createFloatingRateAction(payload)
          : await updateFloatingRateAction(String(floatingRateId), payload);

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(mode === 'create' ? 'Floating rate created.' : 'Floating rate updated.');
      const id = result.resourceId ?? floatingRateId;
      router.push(id ? floatingRateDetailPath(id) : floatingRatesListPath());
      router.refresh();
    });
  }

  return (
    <ListPage
      title={mode === 'create' ? 'Create floating rate' : 'Edit floating rate'}
      description="Name the scheme, set flags, and define effective-dated interest rate periods."
      backLink={
        <DetailBackLink
          href={
            mode === 'create'
              ? floatingRatesListPath()
              : floatingRateDetailPath(floatingRateId ?? '')
          }
          label={mode === 'create' ? 'Back to floating rates' : 'Back to floating rate'}
        />
      }
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {submitError ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        <TextField
          label="Name"
          required
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          disabled={pending}
        />
        <SwitchField
          label="Base lending rate"
          checked={isBaseLendingRate}
          onCheckedChange={setIsBaseLendingRate}
          disabled={pending}
        />
        <SwitchField
          label="Active"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={pending}
        />

        <FloatingRatePeriodsEditor periods={periods} onChange={setPeriods} disabled={pending} />
        {fieldErrors.ratePeriods ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.ratePeriods}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {mode === 'create' ? 'Create floating rate' : 'Save changes'}
          </Button>
          <Link
            href={
              mode === 'create'
                ? floatingRatesListPath()
                : floatingRateDetailPath(floatingRateId ?? '')
            }
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Cancel
          </Link>
        </div>
      </form>
    </ListPage>
  );
}
