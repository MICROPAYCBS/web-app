'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, can, resolvePermission } from '@mifos/auth';
import type { FineractReportRunColumnHeader } from '@mifos/api-client';
import {
  toFineractActionError,
  validateCreateSmsCampaign,
  validateSmsCampaignActivateCommand,
  validateSmsCampaignCloseCommand,
  validateSmsCampaignMessagesQuery,
  validateUpdateSmsCampaign,
  type CreateSmsCampaignInput,
  type SmsCampaignActivateCommandInput,
  type SmsCampaignCloseCommandInput,
  type SmsCampaignMessagesQueryInput,
  type UpdateSmsCampaignInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { buildReportRunQueryParams } from '@/lib/fineract/report-run-display';
import {
  fetchReportParameterMetadata,
  runReport
} from '@/lib/fineract/run-reports';
import {
  buildReportHeaderQueryValues,
  buildSmsCampaignParamValue,
  metadataToReportParameters
} from '@/lib/fineract/sms-campaign-display';
import {
  SMS_CAMPAIGN_LIST_PATH,
  smsCampaignDetailPath,
  smsCampaignEditPath
} from '@/lib/fineract/sms-campaign-paths';
import {
  activateSmsCampaign,
  closeSmsCampaign,
  createSmsCampaign,
  deleteSmsCampaign,
  listSmsCampaignMessagesByStatus,
  reactivateSmsCampaign,
  updateSmsCampaign
} from '@/lib/fineract/sms-campaigns';
import { getServerSession } from '@/lib/session/server';

export type SmsCampaignActionResult =
  | { ok: true; campaignId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

type SmsCampaignReportActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateSmsCampaignViews(campaignId: string | number) {
  revalidatePath(SMS_CAMPAIGN_LIST_PATH);
  revalidatePath(smsCampaignDetailPath(campaignId));
  revalidatePath(smsCampaignEditPath(campaignId));
}

function assertCanConfigureSmsCampaignRules(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (can(session, 'CREATE_SMSCAMPAIGN') || can(session, 'UPDATE_SMSCAMPAIGN')) {
    return;
  }
  throw new Error('Forbidden');
}

export async function fetchSmsCampaignReportParametersAction(
  reportName: string
): Promise<SmsCampaignReportActionResult<ReturnType<typeof metadataToReportParameters>>> {
  const session = await getServerSession();
  try {
    assertCanConfigureSmsCampaignRules(session);
  } catch {
    return { ok: false, message: 'You do not have permission to configure SMS campaign rules.' };
  }

  if (!reportName.trim()) {
    return { ok: false, message: 'Report name is required.' };
  }

  try {
    const metadata = await fetchReportParameterMetadata(reportName.trim());
    return { ok: true, data: metadataToReportParameters(metadata) };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load business rule parameters.');
  }
}

export async function fetchSmsCampaignTemplateColumnsAction(input: {
  reportName: string;
  metadata: Parameters<typeof buildReportHeaderQueryValues>[0]['metadata'];
  values: Record<string, string>;
}): Promise<SmsCampaignReportActionResult<FineractReportRunColumnHeader[]>> {
  const session = await getServerSession();
  try {
    assertCanConfigureSmsCampaignRules(session);
  } catch {
    return { ok: false, message: 'You do not have permission to configure SMS campaign rules.' };
  }

  if (!input.reportName.trim()) {
    return { ok: false, message: 'Report name is required.' };
  }

  try {
    const queryValues = input.metadata.length
      ? buildReportHeaderQueryValues({
          metadata: input.metadata,
          values: input.values
        })
      : input.values;
    const result = await runReport(
      input.reportName.trim(),
      buildReportRunQueryParams(queryValues)
    );
    return { ok: true, data: result.columnHeaders ?? [] };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load template placeholders.');
  }
}

export async function createSmsCampaignAction(
  input: CreateSmsCampaignInput
): Promise<SmsCampaignActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_SMSCAMPAIGN');
  } catch {
    return { ok: false, message: 'You do not have permission to create SMS campaigns.' };
  }

  const parsed = validateCreateSmsCampaign(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createSmsCampaign(parsed.data);
    revalidatePath(SMS_CAMPAIGN_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { campaignId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create SMS campaign.');
  }
}

export async function updateSmsCampaignAction(
  campaignId: string | number,
  input: UpdateSmsCampaignInput
): Promise<SmsCampaignActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SMSCAMPAIGN');
  } catch {
    return { ok: false, message: 'You do not have permission to update SMS campaigns.' };
  }

  const parsed = validateUpdateSmsCampaign(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateSmsCampaign(campaignId, parsed.data);
    revalidateSmsCampaignViews(campaignId);
    return actionSuccessFromFineractCommand(response, { campaignId: response.resourceId ?? Number(campaignId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update SMS campaign.');
  }
}

export async function deleteSmsCampaignAction(
  campaignId: string | number
): Promise<SmsCampaignActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_SMSCAMPAIGN');
  } catch {
    return { ok: false, message: 'You do not have permission to delete SMS campaigns.' };
  }

  try {
    const response = await deleteSmsCampaign(campaignId);
    revalidatePath(SMS_CAMPAIGN_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { campaignId: Number(campaignId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete SMS campaign.');
  }
}

export async function activateSmsCampaignAction(
  campaignId: string | number,
  input: SmsCampaignActivateCommandInput
): Promise<SmsCampaignActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'ACTIVATE_SMSCAMPAIGN');
  } catch {
    return { ok: false, message: 'You do not have permission to activate SMS campaigns.' };
  }

  const parsed = validateSmsCampaignActivateCommand(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await activateSmsCampaign(campaignId, parsed.data);
    revalidateSmsCampaignViews(campaignId);
    return actionSuccessFromFineractCommand(response, { campaignId: Number(campaignId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to activate SMS campaign.');
  }
}

export async function closeSmsCampaignAction(
  campaignId: string | number,
  input: SmsCampaignCloseCommandInput
): Promise<SmsCampaignActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CLOSE_SMSCAMPAIGN');
  } catch {
    return { ok: false, message: 'You do not have permission to close SMS campaigns.' };
  }

  const parsed = validateSmsCampaignCloseCommand(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await closeSmsCampaign(campaignId, parsed.data);
    revalidateSmsCampaignViews(campaignId);
    return actionSuccessFromFineractCommand(response, { campaignId: Number(campaignId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to close SMS campaign.');
  }
}

export async function reactivateSmsCampaignAction(
  campaignId: string | number,
  input: SmsCampaignActivateCommandInput
): Promise<SmsCampaignActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'REACTIVATE_SMSCAMPAIGN');
  } catch {
    return { ok: false, message: 'You do not have permission to reactivate SMS campaigns.' };
  }

  const parsed = validateSmsCampaignActivateCommand(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await reactivateSmsCampaign(campaignId, parsed.data);
    revalidateSmsCampaignViews(campaignId);
    return actionSuccessFromFineractCommand(response, { campaignId: Number(campaignId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to reactivate SMS campaign.');
  }
}

export async function listSmsCampaignMessagesAction(
  campaignId: string | number,
  input: SmsCampaignMessagesQueryInput
): Promise<SmsCampaignReportActionResult<{ pageItems: Awaited<ReturnType<typeof listSmsCampaignMessagesByStatus>>['pageItems'] }>> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.smsCampaigns'));
  } catch {
    return { ok: false, message: 'You do not have permission to view SMS campaigns.' };
  }

  const parsed = validateSmsCampaignMessagesQuery(input);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid message search filters.' };
  }

  try {
    const response = await listSmsCampaignMessagesByStatus(campaignId, parsed.data);
    return { ok: true, data: { pageItems: response.pageItems ?? [] } };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load SMS messages.');
  }
}

export { buildSmsCampaignParamValue };
