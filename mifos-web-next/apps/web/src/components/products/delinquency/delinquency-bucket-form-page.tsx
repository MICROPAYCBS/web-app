'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DelinquencyBucketQueryType,
  DelinquencyRangeListItem,
  DelinquencyStringEnumOption
} from '@mifos/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createDelinquencyBucketAction,
  updateDelinquencyBucketAction
} from '@/actions/delinquency-bucket';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import {
  DelinquencyBucketRangesEditor,
  delinquencyBucketRangeIdsFromDetail
} from '@/components/products/delinquency/delinquency-bucket-ranges-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  delinquencyStringEnumSelectOptions,
  formatDelinquencyBucketType,
  queryParamToApiBucketType
} from '@/lib/fineract/delinquency-display';
import {
  delinquencyBucketDetailPath,
  delinquencyBucketsListPath
} from '@/lib/fineract/delinquency-paths';
import { cn } from '@/lib/utils';

export function DelinquencyBucketFormPage({
  mode,
  bucketType,
  bucketId,
  initialName,
  initialRangeIds,
  initialFrequency,
  initialFrequencyType,
  initialMinimumPayment,
  initialMinimumPaymentType,
  rangeOptions,
  frequencyTypeOptions,
  minimumPaymentOptions
}: {
  mode: 'create' | 'edit';
  bucketType: DelinquencyBucketQueryType;
  bucketId?: number;
  initialName?: string;
  initialRangeIds?: number[];
  initialFrequency?: number;
  initialFrequencyType?: string;
  initialMinimumPayment?: number;
  initialMinimumPaymentType?: string;
  rangeOptions: DelinquencyRangeListItem[];
  frequencyTypeOptions: DelinquencyStringEnumOption[];
  minimumPaymentOptions: DelinquencyStringEnumOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const apiBucketType = queryParamToApiBucketType(bucketType);
  const isWorkingCapital = apiBucketType === 'WORKING_CAPITAL';

  const [name, setName] = useState(initialName ?? '');
  const [frequency, setFrequency] = useState(
    initialFrequency !== undefined ? String(initialFrequency) : ''
  );
  const [frequencyType, setFrequencyType] = useState(initialFrequencyType);
  const [minimumPayment, setMinimumPayment] = useState(
    initialMinimumPayment !== undefined ? String(initialMinimumPayment) : ''
  );
  const [minimumPaymentType, setMinimumPaymentType] = useState(initialMinimumPaymentType);
  const [rangeIds, setRangeIds] = useState<number[]>(initialRangeIds ?? []);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const frequencyTypeSelectOptions = useMemo(
    () => delinquencyStringEnumSelectOptions(frequencyTypeOptions),
    [frequencyTypeOptions]
  );
  const minimumPaymentSelectOptions = useMemo(
    () => delinquencyStringEnumSelectOptions(minimumPaymentOptions),
    [minimumPaymentOptions]
  );

  const title =
    mode === 'create'
      ? `Create ${formatDelinquencyBucketType({ id: apiBucketType }).toLowerCase()} bucket`
      : `Edit ${formatDelinquencyBucketType({ id: apiBucketType }).toLowerCase()} bucket`;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const basePayload = {
      name,
      bucketType: apiBucketType,
      ranges: rangeIds
    };

    const payload = isWorkingCapital
      ? {
          ...basePayload,
          frequency,
          frequencyType,
          minimumPayment,
          minimumPaymentType
        }
      : basePayload;

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createDelinquencyBucketAction(payload)
          : await updateDelinquencyBucketAction(String(bucketId), payload);

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(mode === 'create' ? 'Delinquency bucket created.' : 'Delinquency bucket updated.');
      const id = result.resourceId ?? bucketId;
      router.push(id ? delinquencyBucketDetailPath(id, bucketType) : delinquencyBucketsListPath());
      router.refresh();
    });
  }

  return (
    <ListPage
      title={title}
      description="Name the bucket and assign delinquency ranges."
      backLink={
        <DetailBackLink
          href={
            mode === 'create'
              ? delinquencyBucketsListPath()
              : delinquencyBucketDetailPath(bucketId ?? '', bucketType)
          }
          label={mode === 'create' ? 'Back to delinquency buckets' : 'Back to delinquency bucket'}
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
          disabled={pending || mode === 'edit'}
        />

        {isWorkingCapital ? (
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium">Delinquency payment rule</h3>
            <NumericField
              label="Frequency"
              required
              value={frequency}
              onChange={setFrequency}
              error={fieldErrors.frequency}
              disabled={pending}
            />
            <SelectField
              label="Frequency type"
              required
              value={frequencyType}
              onValueChange={setFrequencyType}
              options={frequencyTypeSelectOptions}
              placeholder="Select frequency type"
              error={fieldErrors.frequencyType}
              disabled={pending}
            />
            <NumericField
              label="Minimum payment"
              required
              value={minimumPayment}
              onChange={setMinimumPayment}
              error={fieldErrors.minimumPayment}
              disabled={pending}
            />
            <SelectField
              label="Minimum payment type"
              required
              value={minimumPaymentType}
              onValueChange={setMinimumPaymentType}
              options={minimumPaymentSelectOptions}
              placeholder="Select minimum payment type"
              error={fieldErrors.minimumPaymentType}
              disabled={pending}
            />
          </div>
        ) : null}

        <DelinquencyBucketRangesEditor
          selectedRangeIds={rangeIds}
          onChange={setRangeIds}
          rangeOptions={rangeOptions}
          disabled={pending}
        />
        {fieldErrors.ranges ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.ranges}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {mode === 'create' ? 'Create delinquency bucket' : 'Save changes'}
          </Button>
          <Link
            href={
              mode === 'create'
                ? delinquencyBucketsListPath()
                : delinquencyBucketDetailPath(bucketId ?? '', bucketType)
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

export { delinquencyBucketRangeIdsFromDetail };
