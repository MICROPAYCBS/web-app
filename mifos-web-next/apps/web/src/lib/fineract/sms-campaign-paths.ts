/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const SMS_CAMPAIGN_LIST_PATH = '/organization/sms-campaigns';

export function smsCampaignDetailPath(campaignId: string | number): string {
  return `${SMS_CAMPAIGN_LIST_PATH}/${campaignId}`;
}

export function smsCampaignCreatePath(): string {
  return `${SMS_CAMPAIGN_LIST_PATH}/create`;
}

export function smsCampaignEditPath(campaignId: string | number): string {
  return `${smsCampaignDetailPath(campaignId)}/edit`;
}
