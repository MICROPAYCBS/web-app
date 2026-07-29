/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientIdentifierTemplate } from '@mifos/api-client';
import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CheckerInboxDetailView } from '@/components/tasks/checker-inbox-detail-view';
import {
  createClientDraftFromCommandAsJson,
  isCreateClientCheckerCommand
} from '@/lib/checker-inbox/create-client-command-review';
import { enrichCheckerInboxDetail } from '@/lib/checker-inbox/enrich-checker-inbox-items';
import { loadApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-runtime';
import { getClientIncomeSourceTemplate } from '@/lib/fineract/client-income-source';
import { getClientIdentifierTemplate } from '@/lib/fineract/client-identifiers';
import { getClientTemplate } from '@/lib/fineract/clients';
import { getCheckerInboxDetail } from '@/lib/fineract/checker-inbox';
import { listContactTypes } from '@/lib/fineract/contact-types';
import { getServerSession } from '@/lib/session/server';

export default async function CheckerInboxDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('checkerInbox'))) {
    notFound();
  }

  const { id } = await params;
  const checkerId = Number(id);
  if (!Number.isFinite(checkerId)) {
    notFound();
  }

  const [item, workflowRuntime] = await Promise.all([
    getCheckerInboxDetail(checkerId),
    loadApprovalWorkflowRuntimeContext()
  ]);
  if (!item) {
    notFound();
  }

  const context = await enrichCheckerInboxDetail(item, workflowRuntime);

  let createClientReview = null;
  if (isCreateClientCheckerCommand(item.actionName, item.entityName)) {
    const draft = createClientDraftFromCommandAsJson(item.commandAsJson);
    if (draft) {
      const officeId = draft.general.officeId;
      const [template, incomeSourceOptions, identifierTemplate, contactTypeOptions] =
        await Promise.all([
          getClientTemplate(officeId).catch(() => getClientTemplate()),
          getClientIncomeSourceTemplate(1).catch(() => ({})),
          getClientIdentifierTemplate(1).catch(
            (): FineractClientIdentifierTemplate => ({
              allowedDocumentTypes: [],
              identityTypeOptions: []
            })
          ),
          listContactTypes().catch(() => [])
        ]);

      createClientReview = {
        draft,
        template,
        incomeSourceOptions,
        identifierDocumentTypes:
          identifierTemplate.allowedDocumentTypes?.map((type) => ({
            id: type.id,
            name: type.name
          })) ?? [],
        contactTypeOptions
      };
    }
  }

  return (
    <CheckerInboxDetailView
      item={item}
      context={context}
      taskPermissions={workflowRuntime.makerCheckerPermissions}
      createClientReview={createClientReview}
    />
  );
}
