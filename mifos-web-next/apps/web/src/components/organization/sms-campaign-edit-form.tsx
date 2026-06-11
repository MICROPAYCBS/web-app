'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportRunColumnHeader, SmsCampaignDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  fetchSmsCampaignTemplateColumnsAction,
  updateSmsCampaignAction
} from '@/actions/sms-campaign';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  FINERACT_DATETIME_FORMAT,
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  formatFineractDateArray
} from '@/lib/fineract/dates';
import {
  formatSmsCampaignStatus,
  formatSmsCampaignSubmittedOn,
  parseSmsCampaignParamValue,
  SCHEDULED_TRIGGER_TYPE
} from '@/lib/fineract/sms-campaign-display';
import { smsCampaignDetailPath } from '@/lib/fineract/sms-campaign-paths';

export function SmsCampaignEditForm({ campaign }: { campaign: SmsCampaignDetail }) {
  const router = useRouter();
  const [message, setMessage] = useState(campaign.campaignMessage);
  const [placeholders, setPlaceholders] = useState<FineractReportRunColumnHeader[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingPlaceholders, startLoadTransition] = useTransition();

  const paramValue = parseSmsCampaignParamValue(campaign.paramValue);
  const triggerTypeId = campaign.triggerType?.id ?? 0;

  useEffect(() => {
    if (!paramValue?.reportName || typeof paramValue.reportName !== 'string') {
      return;
    }

    startLoadTransition(async () => {
      const values: Record<string, string> = {};
      for (const [key, value] of Object.entries(paramValue)) {
        if (key === 'reportName') {
          continue;
        }
        values[key] = String(value ?? '');
      }

      const result = await fetchSmsCampaignTemplateColumnsAction({
        reportName: String(paramValue.reportName),
        metadata: [],
        values
      });
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setPlaceholders(result.data);
    });
  }, [campaign.paramValue, paramValue]);

  function insertPlaceholder(columnName: string) {
    setMessage((current) => `${current} {{${columnName}}} `);
  }

  function handleSubmit() {
    if (!paramValue) {
      setSubmitError('Campaign parameters are missing.');
      return;
    }

    setSubmitError(null);
    startTransition(async () => {
      const result = await updateSmsCampaignAction(campaign.id, {
        campaignName: campaign.campaignName,
        triggerType: triggerTypeId,
        runReportId: campaign.runReportId ?? 0,
        isNotification: Boolean(campaign.isNotification),
        providerId: campaign.providerId ?? null,
        message: message.trim(),
        paramValue: paramValue as { reportName: string },
        recurrenceStartDate:
          triggerTypeId === SCHEDULED_TRIGGER_TYPE
            ? formatFineractDateArray(campaign.recurrenceStartDate) ?? undefined
            : undefined,
        locale: FINERACT_LOCALE,
        dateFormat: FINERACT_DATE_FORMAT,
        dateTimeFormat: FINERACT_DATETIME_FORMAT
      });

      if (!result.ok) {
        const errorMessage = formatActionErrorMessage(result.message, result.fieldErrors);
        setSubmitError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success('SMS campaign updated');
      router.push(smsCampaignDetailPath(campaign.id));
      router.refresh();
    });
  }

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={smsCampaignDetailPath(campaign.id)}
              label="Back to campaign"
            />
          }
          title={`Edit ${campaign.campaignName}`}
        />
      }
    >
      <DetailSection title="Campaign overview">
        <DetailFieldGrid>
          <DetailField label="Report name">{campaign.reportName ?? '—'}</DetailField>
          <DetailField label="Status">
            {formatSmsCampaignStatus(campaign.campaignStatus?.value)}
          </DetailField>
          <DetailField label="Trigger type">{campaign.triggerType?.value ?? '—'}</DetailField>
          <DetailField label="Submitted on">{formatSmsCampaignSubmittedOn(campaign)}</DetailField>
        </DetailFieldGrid>
        <p className="text-sm text-muted-foreground">
          Only the message can be edited. Other campaign settings are read-only.
        </p>
      </DetailSection>

      <DetailSection title="Message">
        {loadError ? <p className="mb-2 text-sm text-destructive">{loadError}</p> : null}
        {loadingPlaceholders ? (
          <p className="mb-2 text-sm text-muted-foreground">Loading placeholders…</p>
        ) : null}
        {placeholders.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {placeholders.map((column) => (
              <Button
                key={column.columnName}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertPlaceholder(column.columnName)}
              >
                {column.columnName}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <FieldLabel htmlFor="campaign-message">Message</FieldLabel>
          <Textarea
            id="campaign-message"
            rows={8}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>

        {submitError ? <p className="mt-2 text-sm text-destructive">{submitError}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(smsCampaignDetailPath(campaign.id))}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending || !message.trim()}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </DetailSection>
    </DetailPage>
  );
}
