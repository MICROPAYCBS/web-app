'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SmsCampaignTemplate } from '@mifos/api-client';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { optionLabel, SCHEDULED_TRIGGER_TYPE } from '@/lib/fineract/sms-campaign-display';
import type { SmsCampaignWizardDraft } from '../types';

export function PreviewStep({
  template,
  draft
}: {
  template: SmsCampaignTemplate;
  draft: SmsCampaignWizardDraft;
}) {
  const selectedRule = template.businessRulesOptions.find(
    (rule) => rule.reportId === Number(draft.runReportId)
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h2 className="text-sm font-medium">Review campaign</h2>
        <p className="text-sm text-muted-foreground">
          Confirm the details below before creating the campaign.
        </p>
      </div>

      <DetailFieldGrid>
        <DetailField label="Campaign name">{draft.campaignName}</DetailField>
        <DetailField label="Trigger type">
          {optionLabel(template.triggerTypeOptions, Number(draft.triggerType))}
        </DetailField>
        <DetailField label="Notification">
          {draft.isNotification ? 'Yes' : 'No'}
        </DetailField>
        {!draft.isNotification ? (
          <DetailField label="SMS provider">
            {optionLabel(template.smsProviderOptions, Number(draft.providerId))}
          </DetailField>
        ) : null}
        <DetailField label="Business rule">{selectedRule?.reportName ?? '—'}</DetailField>
        {draft.triggerType === SCHEDULED_TRIGGER_TYPE ? (
          <>
            <DetailField label="Schedule date">{draft.recurrenceStartDate || '—'}</DetailField>
            <DetailField label="Frequency">{draft.frequency || '—'}</DetailField>
            <DetailField label="Interval">{draft.interval || '—'}</DetailField>
            {draft.frequency === 2 ? (
              <DetailField label="Repeats on day">{draft.repeatsOnDay || '—'}</DetailField>
            ) : null}
          </>
        ) : null}
      </DetailFieldGrid>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Message</p>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
          {draft.message}
        </div>
      </div>
    </div>
  );
}
