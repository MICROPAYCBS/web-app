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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
];

export function CampaignStep({
  template,
  draft,
  onChange,
  errors
}: {
  template: SmsCampaignTemplate;
  draft: SmsCampaignWizardDraft;
  onChange: (patch: Partial<SmsCampaignWizardDraft>) => void;
  errors: StepErrors;
}) {
  const [pending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);

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
    return repetitionIntervalsForFrequency(Number(draft.frequency));
  }, [draft.frequency]);

  useEffect(() => {
    if (draft.runReportId === '') {
      onChange({
        reportName: '',
        businessRuleMetadata: [],
        businessRuleValues: {},
        templateColumns: []
      });
      return;
    }

    const rule = businessRules.find((entry) => entry.reportId === Number(draft.runReportId));
    if (!rule) {
      return;
    }

    startTransition(async () => {
      const result = await fetchSmsCampaignReportParametersAction(rule.reportName);
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setLoadError(null);
      onChange({
        reportName: rule.reportName,
        businessRuleMetadata: result.data,
        businessRuleValues: {},
        templateColumns: []
      });
    });
  }, [draft.runReportId, businessRules, onChange]);

  function handleLoadPlaceholders(values: Record<string, string>) {
    if (!draft.reportName) {
      return;
    }
    setLoadError(null);
    startTransition(async () => {
      const result = await fetchSmsCampaignTemplateColumnsAction({
        reportName: draft.reportName,
        metadata: draft.businessRuleMetadata,
        values
      });
      if (!result.ok) {
        setLoadError(result.message);
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

        <div className="space-y-2">
          <FieldLabel htmlFor="triggerType">Trigger type</FieldLabel>
          <Select
            value={draft.triggerType === '' ? undefined : String(draft.triggerType)}
            onValueChange={(value) =>
              onChange({
                triggerType: Number(value),
                runReportId: '',
                templateColumns: [],
                businessRuleMetadata: [],
                businessRuleValues: {}
              })
            }
          >
            <SelectTrigger id="triggerType">
              <SelectValue placeholder="Select trigger type" />
            </SelectTrigger>
            <SelectContent>
              {template.triggerTypeOptions.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.triggerType ? (
            <p className="text-sm text-destructive">{errors.triggerType}</p>
          ) : null}
        </div>

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
          <div className="space-y-2">
            <FieldLabel htmlFor="providerId">SMS provider</FieldLabel>
            <Select
              value={draft.providerId === '' ? undefined : String(draft.providerId)}
              onValueChange={(value) => onChange({ providerId: Number(value) })}
            >
              <SelectTrigger id="providerId">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {template.smsProviderOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

            <div className="space-y-2">
              <FieldLabel htmlFor="frequency">Repeats</FieldLabel>
              <Select
                value={draft.frequency === '' ? undefined : String(draft.frequency)}
                onValueChange={(value) =>
                  onChange({
                    frequency: Number(value),
                    interval: '',
                    repeatsOnDay: ''
                  })
                }
              >
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Daily</SelectItem>
                  <SelectItem value="2">Weekly</SelectItem>
                  <SelectItem value="3">Monthly</SelectItem>
                  <SelectItem value="4">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {errors.frequency ? (
                <p className="text-sm text-destructive">{errors.frequency}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="interval">Repetition interval</FieldLabel>
              <Select
                value={draft.interval === '' ? undefined : String(draft.interval)}
                onValueChange={(value) => onChange({ interval: Number(value) })}
              >
                <SelectTrigger id="interval">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {repetitionIntervals.map((interval) => (
                    <SelectItem key={interval} value={interval}>
                      {interval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.interval ? (
                <p className="text-sm text-destructive">{errors.interval}</p>
              ) : null}
            </div>

            {draft.frequency === 2 ? (
              <div className="space-y-2">
                <FieldLabel htmlFor="repeatsOnDay">Repeats on day</FieldLabel>
                <Select
                  value={draft.repeatsOnDay === '' ? undefined : String(draft.repeatsOnDay)}
                  onValueChange={(value) => onChange({ repeatsOnDay: Number(value) })}
                >
                  <SelectTrigger id="repeatsOnDay">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_OPTIONS.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.repeatsOnDay ? (
                  <p className="text-sm text-destructive">{errors.repeatsOnDay}</p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        <div className="space-y-2 md:col-span-2">
          <FieldLabel htmlFor="runReportId">Business rule</FieldLabel>
          <Select
            value={draft.runReportId === '' ? undefined : String(draft.runReportId)}
            onValueChange={(value) => onChange({ runReportId: Number(value) })}
          >
            <SelectTrigger id="runReportId">
              <SelectValue placeholder="Select business rule" />
            </SelectTrigger>
            <SelectContent>
              {businessRules.map((rule) => (
                <SelectItem key={rule.reportId} value={String(rule.reportId)}>
                  {rule.reportName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.runReportId ? (
            <p className="text-sm text-destructive">{errors.runReportId}</p>
          ) : null}
        </div>
      </div>

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
          {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
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
