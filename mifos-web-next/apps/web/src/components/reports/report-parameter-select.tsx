'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportRunParameterOption } from '@mifos/api-client';
import { useEffect, useMemo, useState } from 'react';
import { fetchReportParameterOptionsAction } from '@/actions/report-run';
import { SelectField } from '@/components/composites/select-field';

export function ReportParameterSelect({
  id,
  label,
  parameterReportName,
  selectAll = false,
  value,
  onValueChange,
  parentVariable,
  parentValue,
  disabled = false,
  error,
  placeholder = 'Select an option'
}: {
  id?: string;
  label: string;
  parameterReportName: string;
  selectAll?: boolean;
  value?: string;
  onValueChange: (value: string | undefined) => void;
  parentVariable?: string;
  parentValue?: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}) {
  const [options, setOptions] = useState<FineractReportRunParameterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const parentBlocked = Boolean(parentVariable && !parentValue);

  useEffect(() => {
    if (parentBlocked) {
      setOptions([]);
      setFetchError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    void (async () => {
      const result = await fetchReportParameterOptionsAction({
        parameterReportName,
        parentVariable,
        parentValue
      });
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setOptions([]);
        setFetchError(result.message);
        setLoading(false);
        return;
      }
      setOptions(result.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [parameterReportName, parentVariable, parentValue, parentBlocked]);

  const selectOptions = useMemo(() => {
    const mapped = options.map((option) => ({
      value: String(option.id),
      label: option.name,
      keywords: [String(option.id)]
    }));
    if (selectAll && !mapped.some((option) => option.value === '-1')) {
      mapped.push({ value: '-1', label: 'All', keywords: ['-1', 'all'] });
    }
    return mapped;
  }, [options, selectAll]);

  const resolvedPlaceholder = parentBlocked
    ? 'Select parent parameter first'
    : loading
      ? 'Loading…'
      : placeholder;

  const emptyMessage = fetchError ?? (loading ? 'Loading…' : 'No results found.');

  return (
    <SelectField
      id={id}
      label={label}
      required
      value={value}
      onValueChange={onValueChange}
      options={selectOptions}
      disabled={disabled || parentBlocked || loading}
      placeholder={resolvedPlaceholder}
      emptyMessage={emptyMessage}
      error={error}
    />
  );
}
