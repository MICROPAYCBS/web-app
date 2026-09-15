'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SmsCampaignTemplate } from '@mifos/api-client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  fetchSmsCampaignReportParametersAction,
  fetchSmsCampaignTemplateColumnsAction
} from '@/actions/sms-campaign';
import { ReportParameterForm } from '@/components/reports/report-parameter-form';
import { LookupLoadError } from '@/components/composites/lookup-load-error';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  enumToSelectOptions,
  fineractEnumToSelectOptions,
  labeledOptionsToSelectOptions
} from '@/lib/form/select-options';
import {
  filterBusinessRulesForTrigger,
  repetitionIntervalsForFrequency,
  SCHEDULED_TRIGGER_TYPE
} from '@/lib/fineract/sms-campaign-display';
import type { SmsCampaignWizardDraft } from '../types';
import type { StepErrors } from '../validation';

const WEEKDAY_OPTIONS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' }
] as const;

const WEEKDAY_SELECT_OPTIONS = labeledOptionsToSelectOptions([...WEEKDAY_OPTIONS]);

const SMS_FREQUENCY_OPTIONS = labeledOptionsToSelectOptions([
  { value: '1', label: 'Daily' },
  { value: '2', label: 'Weekly' },
  { value: '3', label: 'Monthly' },
  { value: '4', label: 'Yearly' }
]);

export function CampaignStep({
  template,
  draft,
  onChange,
  errors,
  onLookupErrorChange
}: {
  template: SmsCampaignTemplate;
  draft: SmsCampaignWizardDraft;
  onChange: (patch: Partial<SmsCampaignWizardDraft>) => void;
  errors: StepErrors;
  onLookupErrorChange?: (message: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  function reportLookupError(message: string | null) {
    setLoadError(message);
    onLookupErrorChange?.(message);
  }

  const businessRules = useMemo(() => {
    if (draft.triggerType === '') {
      return template.businessRulesOptions;
    }
    return filterBusinessRulesForTrigger(template.businessRulesOptions, Number(draft.triggerType));
  }, [draft.triggerType, template.businessRulesOptions]);

  const repetitionIntervals = useMemo(() => {
    if (draft.frequency === '') {
      return [];
    }
    return enumToSelectOptions(
      repetitionIntervalsForFrequency(Number(draft.frequency)).map(String)
    );
  }, [draft.frequency]);

  const triggerTypeOptions = useMemo(
    () => fineractEnumToSelectOptions(template.triggerTypeOptions),
    [template.triggerTypeOptions]
  );
  const providerOptions = useMemo(
    () => fineractEnumToSelectOptions(template.smsProviderOptions),
    [template.smsProviderOptions]
  );
  const businessRuleOptions = useMemo(
    () =>
      businessRules.map((rule) => ({
        value: String(rule.reportId),
        label: rule.reportName,
        keywords: [rule.reportName, String(rule.reportId)]
      })),
    [businessRules]
  );

  useEffect(() => {
    if (draft.runReportId === '') {
      onChange({
        reportName: '',
        businessRuleMetadata: [],
        businessRuleValues: {},
        templateColumns: []
      });
      reportLookupError(null);
      return;
    }

    const rule = businessRules.find((entry) => entry.reportId === Number(draft.runReportId));
    if (!rule) {
      return;
    }
    if (draft.reportName === rule.reportName && draft.businessRuleMetadata.length > 0) {
      reportLookupError(null);
      return;
    }

    startTransition(async () => {
      const result = await fetchSmsCampaignReportParametersAction(rule.reportName);
      if (!result.ok) {
        reportLookupError(result.message.trim() || 'Could not load campaign options.');
        return;
      }
      reportLookupError(null);
      onChange({
        reportName: rule.reportName,
        businessRuleMetadata: result.data,
        businessRuleValues: {},
        templateColumns: []
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retryToken retriggers the same report load
  }, [draft.runReportId, businessRules, onChange, retryToken]);

  function handleLoadPlaceholders(values: Record<string, string>) {
    if (!draft.reportName) {
      return;
    }
    reportLookupError(null);
    startTransition(async () => {
      const result = await fetchSmsCampaignTemplateColumnsAction({
        reportName: draft.reportName,
        metadata: draft.businessRuleMetadata,
        values
      });
      if (!result.ok) {
        reportLookupError(result.message.trim() || 'Could not load message placeholders.');
        return;
      }
      onChange({
        businessRuleValues: values,
        templateColumns: result.data
      });
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <FieldLabel htmlFor="campaignName">Campaign name</FieldLabel>
          <Input
            id="campaignName"
            value={draft.campaignName}
            onChange={(event) => onChange({ campaignName: event.target.value })}
            placeholder="Campaign name"
          />
          {errors.campaignName ? (
            <p className="text-sm text-destructive">{errors.campaignName}</p>
          ) : null}
        </div>

        <SelectField
          id="triggerType"
          label="Trigger type"
          value={draft.triggerType === '' ? '' : String(draft.triggerType)}
          onValueChange={(value) =>
            value &&
            onChange({
              triggerType: Number(value),
              runReportId: '',
              templateColumns: [],
              businessRuleMetadata: [],
              businessRuleValues: {}
            })
          }
          options={triggerTypeOptions}
          placeholder="Select trigger type"
          error={errors.triggerType}
        />

        <Field orientation="horizontal" className="items-center gap-3">
          <Checkbox
            id="isNotification"
            checked={draft.isNotification}
            onCheckedChange={(checked) =>
              onChange({
                isNotification: checked === true,
                providerId: checked === true ? '' : draft.providerId
              })
            }
          />
          <FieldContent>
            <FieldLabel htmlFor="isNotification">Is notification?</FieldLabel>
          </FieldContent>
        </Field>

        {!draft.isNotification ? (
          <SelectField
            id="providerId"
            label="SMS provider"
            value={draft.providerId === '' ? '' : String(draft.providerId)}
            onValueChange={(value) => value && onChange({ providerId: Number(value) })}
            options={providerOptions}
            placeholder="Select provider"
          />
        ) : null}

        {draft.triggerType === SCHEDULED_TRIGGER_TYPE ? (
          <>
            <div className="space-y-2">
              <FieldLabel htmlFor="recurrenceStartDate">Schedule date</FieldLabel>
              <Input
                id="recurrenceStartDate"
                type="datetime-local"
                value={draft.recurrenceStartDate}
                onChange={(event) => onChange({ recurrenceStartDate: event.target.value })}
              />
              {errors.recurrenceStartDate ? (
                <p className="text-sm text-destructive">{errors.recurrenceStartDate}</p>
              ) : null}
            </div>

            <SelectField
              id="frequency"
              label="Repeats"
              value={draft.frequency === '' ? '' : String(draft.frequency)}
              onValueChange={(value) =>
                value &&
                onChange({
                  frequency: Number(value),
                  interval: '',
                  repeatsOnDay: ''
                })
              }
              options={SMS_FREQUENCY_OPTIONS}
              placeholder="Select frequency"
              error={errors.frequency}
            />

            <SelectField
              id="interval"
              label="Repetition interval"
              value={draft.interval === '' ? '' : String(draft.interval)}
              onValueChange={(value) => value && onChange({ interval: Number(value) })}
              options={repetitionIntervals}
              placeholder="Select interval"
              error={errors.interval}
            />

            {draft.frequency === 2 ? (
              <SelectField
                id="repeatsOnDay"
                label="Repeats on day"
                value={draft.repeatsOnDay === '' ? '' : String(draft.repeatsOnDay)}
                onValueChange={(value) => value && onChange({ repeatsOnDay: Number(value) })}
                options={WEEKDAY_SELECT_OPTIONS}
                placeholder="Select day"
                error={errors.repeatsOnDay}
              />
            ) : null}
          </>
        ) : null}

        <SelectField
          id="runReportId"
          label="Business rule"
          className="md:col-span-2"
          value={draft.runReportId === '' ? '' : String(draft.runReportId)}
          onValueChange={(value) => value && onChange({ runReportId: Number(value) })}
          options={businessRuleOptions}
          placeholder="Select business rule"
          error={errors.runReportId}
          loading={pending && draft.runReportId !== '' && !draft.businessRuleMetadata.length}
          onRetry={
            draft.runReportId !== ''
              ? () => {
                  reportLookupError(null);
                  setRetryToken((current) => current + 1);
                }
              : undefined
          }
        />
      </div>

      {loadError ? (
        <LookupLoadError
          message={loadError}
          onRetry={() => {
            reportLookupError(null);
            if (draft.businessRuleMetadata.length && draft.reportName) {
              handleLoadPlaceholders(draft.businessRuleValues);
              return;
            }
            if (draft.runReportId !== '') {
              setRetryToken((current) => current + 1);
            }
          }}
        />
      ) : null}

      {draft.businessRuleMetadata.length ? (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <h2 className="text-sm font-medium">Business rule parameters</h2>
            <p className="text-sm text-muted-foreground">
              Fill in the report parameters, then load template placeholders for the message step.
            </p>
          </div>
          <ReportParameterForm
            formId="sms-campaign-business-rule"
            parameters={draft.businessRuleMetadata}
            disabled={pending}
            onSubmit={handleLoadPlaceholders}
          />
          <Button type="submit" form="sms-campaign-business-rule" disabled={pending}>
            {pending ? 'Loading…' : 'Load template placeholders'}
          </Button>
          {errors.businessRule ? (
            <p className="text-sm text-destructive">{errors.businessRule}</p>
          ) : null}
          {draft.templateColumns.length ? (
            <p className="text-sm text-muted-foreground">
              {draft.templateColumns.length} placeholder
              {draft.templateColumns.length === 1 ? '' : 's'} loaded.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
