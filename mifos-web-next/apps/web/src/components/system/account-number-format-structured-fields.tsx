'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountNumberPreferenceTemplate } from '@mifos/api-client';
import {
  ACCOUNT_NUMBER_FORMAT_MAX_LENGTH,
  accountTypeUsesClientTypeLabel,
  accountTypeUsesProductShortName,
  defaultPatternForAccountType,
  patternIncludesOfficeCode,
  patternToSegments,
  segmentTokenOptionsForAccountType,
  sequenceScopeAllowedForAccountType,
  segmentsToPattern,
  type FormatSegmentRow
} from '@mifos/domain';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { previewAccountNumberFormatAction } from '@/actions/account-number-preferences';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { accountNumberPreferenceLabel } from '@/lib/fineract/account-number-preference-display';

export type AccountNumberFormatOfficeOption = {
  id: number;
  label: string;
};

export type StructuredFormatFieldValues = {
  formatPattern: string;
  sequenceScope?: string;
  checkDigitAlgorithm?: string;
};

export function AccountNumberFormatStructuredFields({
  accountTypeId,
  template,
  values,
  onChange,
  officeOptions,
  fieldErrors,
  disabled = false
}: {
  accountTypeId?: number;
  template: FineractAccountNumberPreferenceTemplate;
  values: StructuredFormatFieldValues;
  onChange: (patch: Partial<StructuredFormatFieldValues>) => void;
  officeOptions: AccountNumberFormatOfficeOption[];
  fieldErrors: Record<string, string>;
  disabled?: boolean;
}) {
  const [segments, setSegments] = useState<FormatSegmentRow[]>([]);
  const [advancedPattern, setAdvancedPattern] = useState(values.formatPattern);
  const [previewOfficeId, setPreviewOfficeId] = useState<string | undefined>();
  const [previewProductShortName, setPreviewProductShortName] = useState('SV');
  const [previewClientTypeLabel, setPreviewClientTypeLabel] = useState('Individual');
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPending, startPreviewTransition] = useTransition();

  const segmentTokenOptions = useMemo(() => {
    const tokens = segmentTokenOptionsForAccountType(
      accountTypeId,
      template.segmentTokenOptions ?? []
    );
    return tokens.map((token) => ({
      value: token,
      label: token
    }));
  }, [accountTypeId, template.segmentTokenOptions]);

  const sequenceScopeOptions = useMemo(
    () =>
      (template.sequenceScopeOptions ?? [])
        .filter((option) => sequenceScopeAllowedForAccountType(accountTypeId, option.id))
        .map((option) => ({
          value: String(option.id),
          label: accountNumberPreferenceLabel(option)
        })),
    [accountTypeId, template.sequenceScopeOptions]
  );

  const checkDigitOptions = useMemo(
    () =>
      (template.checkDigitAlgorithmOptions ?? []).map((option) => ({
        value: String(option.id),
        label: accountNumberPreferenceLabel(option)
      })),
    [template.checkDigitAlgorithmOptions]
  );

  useEffect(() => {
    const nextSegments = patternToSegments(values.formatPattern);
    setSegments(nextSegments.length > 0 ? nextSegments : []);
    setAdvancedPattern(values.formatPattern);
  }, [values.formatPattern]);

  useEffect(() => {
    if (!previewOfficeId && officeOptions.length > 0) {
      setPreviewOfficeId(String(officeOptions[0].id));
    }
  }, [officeOptions, previewOfficeId]);

  useEffect(() => {
    if (!values.sequenceScope || !Number.isFinite(accountTypeId)) {
      return;
    }
    if (!sequenceScopeAllowedForAccountType(accountTypeId, Number(values.sequenceScope))) {
      onChange({ sequenceScope: undefined });
    }
  }, [accountTypeId, onChange, values.sequenceScope]);

  function syncPatternFromSegments(nextSegments: FormatSegmentRow[]) {
    const pattern = segmentsToPattern(nextSegments);
    setSegments(nextSegments);
    setAdvancedPattern(pattern);
    onChange({ formatPattern: pattern });
  }

  function handleSegmentChange(index: number, patch: Partial<FormatSegmentRow>) {
    const nextSegments = segments.map((segment, segmentIndex) =>
      segmentIndex === index ? { ...segment, ...patch } : segment
    );
    syncPatternFromSegments(nextSegments);
  }

  function handleAddSegment() {
    const defaultToken = segmentTokenOptions[0]?.value ?? 'sequence';
    syncPatternFromSegments([...segments, { token: defaultToken, width: 1 }]);
  }

  function handleRemoveSegment(index: number) {
    syncPatternFromSegments(segments.filter((_, segmentIndex) => segmentIndex !== index));
  }

  function handleAdvancedPatternChange(pattern: string) {
    setAdvancedPattern(pattern);
    onChange({ formatPattern: pattern });
  }

  function handleUseDefaultPattern() {
    if (!Number.isFinite(accountTypeId)) {
      return;
    }
    const defaults = defaultPatternForAccountType(accountTypeId!);
    if (!defaults) {
      return;
    }
    onChange({
      formatPattern: defaults.formatPattern,
      sequenceScope: String(defaults.sequenceScope),
      checkDigitAlgorithm: String(defaults.checkDigitAlgorithm)
    });
  }

  function handleRefreshPreview() {
    if (!Number.isFinite(accountTypeId)) {
      return;
    }

    setPreviewError(null);
    startPreviewTransition(async () => {
      const result = await previewAccountNumberFormatAction({
        accountType: accountTypeId!,
        officeId: previewOfficeId ? Number(previewOfficeId) : undefined,
        productShortName: accountTypeUsesProductShortName(accountTypeId!)
          ? previewProductShortName
          : undefined,
        clientTypeLabel: accountTypeUsesClientTypeLabel(accountTypeId!)
          ? previewClientTypeLabel
          : undefined,
        formatPattern: values.formatPattern.trim() || undefined,
        sequenceScope: values.sequenceScope ? Number(values.sequenceScope) : undefined,
        checkDigitAlgorithm: values.checkDigitAlgorithm
          ? Number(values.checkDigitAlgorithm)
          : undefined
      });

      if (!result.ok) {
        setPreviewResult(null);
        setPreviewError(result.message);
        return;
      }

      setPreviewResult(result.preview.accountNumber);
    });
  }

  const showOfficeCodeWarning = patternIncludesOfficeCode(values.formatPattern);

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Structured format</h3>
          <p className="text-xs text-muted-foreground">
            Build a pattern from segments. Total width must be {ACCOUNT_NUMBER_FORMAT_MAX_LENGTH}{' '}
            characters or less.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !Number.isFinite(accountTypeId)}
          onClick={handleUseDefaultPattern}
        >
          Use default pattern
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Segments</p>
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add at least one segment to build a pattern.</p>
        ) : null}
        {segments.map((segment, index) => (
          <div key={`${segment.token}-${index}`} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <SelectField
                label="Token"
                value={segment.token}
                onValueChange={(value) =>
                  handleSegmentChange(index, { token: value ?? segment.token })
                }
                options={segmentTokenOptions}
                disabled={disabled || segmentTokenOptions.length === 0}
                placeholder="Select token"
              />
            </div>
            <div className="w-24 shrink-0">
              <NumericField
                label="Width"
                integer
                value={String(segment.width)}
                onChange={(value) =>
                  handleSegmentChange(index, {
                    width: Math.max(1, Number.parseInt(value || '1', 10) || 1)
                  })
                }
                disabled={disabled}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6 shrink-0"
              disabled={disabled}
              onClick={() => handleRemoveSegment(index)}
              aria-label="Remove segment"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || segmentTokenOptions.length === 0}
          onClick={handleAddSegment}
        >
          <Plus className="mr-2 size-4" />
          Add segment
        </Button>
      </div>

      <TextField
        label="Pattern (advanced)"
        value={advancedPattern}
        onChange={handleAdvancedPatternChange}
        error={fieldErrors.formatPattern}
        disabled={disabled}
        hint="Edit the raw pattern string directly if needed."
      />

      <SelectField
        label="Sequence scope"
        required
        value={values.sequenceScope}
        onValueChange={(value) => onChange({ sequenceScope: value })}
        options={sequenceScopeOptions}
        disabled={disabled || sequenceScopeOptions.length === 0}
        error={fieldErrors.sequenceScope}
        placeholder="Select scope"
      />

      <SelectField
        label="Check digit algorithm"
        required
        value={values.checkDigitAlgorithm}
        onValueChange={(value) => onChange({ checkDigitAlgorithm: value })}
        options={checkDigitOptions}
        disabled={disabled || checkDigitOptions.length === 0}
        error={fieldErrors.checkDigitAlgorithm}
        placeholder="Select algorithm"
      />

      {showOfficeCodeWarning ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          This pattern uses branch codes. Ensure every active branch has a branch code on the{' '}
          <Link href="/organization/offices" className="text-primary underline-offset-4 hover:underline">
            branches
          </Link>{' '}
          screen before creating new accounts.
        </p>
      ) : null}

      <div className="space-y-3 rounded-lg border border-border p-3">
        <div>
          <h4 className="text-sm font-medium">Preview</h4>
          <p className="text-xs text-muted-foreground">
            Sample number for the next sequence value. Does not consume a sequence counter.
          </p>
        </div>
        <SelectField
          label="Office"
          value={previewOfficeId}
          onValueChange={setPreviewOfficeId}
          options={officeOptions.map((office) => ({
            value: String(office.id),
            label: office.label
          }))}
          disabled={disabled || officeOptions.length === 0}
          placeholder="Select office"
        />
        {accountTypeUsesProductShortName(accountTypeId ?? 0) ? (
          <TextField
            label="Product short name"
            value={previewProductShortName}
            onChange={setPreviewProductShortName}
            disabled={disabled}
            placeholder="e.g. SV"
          />
        ) : null}
        {accountTypeUsesClientTypeLabel(accountTypeId ?? 0) ? (
          <TextField
            label="Client type label"
            value={previewClientTypeLabel}
            onChange={setPreviewClientTypeLabel}
            disabled={disabled}
            placeholder="e.g. Individual"
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || previewPending || !Number.isFinite(accountTypeId)}
            onClick={handleRefreshPreview}
          >
            {previewPending ? 'Refreshing…' : 'Refresh preview'}
          </Button>
          {previewResult ? (
            <p className="font-mono text-sm">
              Sample number: <span className="font-semibold">{previewResult}</span>
            </p>
          ) : null}
        </div>
        {previewError ? <p className="text-sm text-destructive">{previewError}</p> : null}
      </div>
    </div>
  );
}
