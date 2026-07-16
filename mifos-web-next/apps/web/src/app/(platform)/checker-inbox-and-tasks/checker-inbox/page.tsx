/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CheckerInboxPageContent } from '@/components/tasks/checker-inbox-page-content';
import { enrichCheckerInboxItems } from '@/lib/checker-inbox/enrich-checker-inbox-items';
import { loadApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-runtime';
import { listCheckerInboxItems } from '@/lib/fineract/checker-inbox';
import type { CheckerInboxSearchFilters } from '@/lib/fineract/checker-inbox-query';
import { parseCheckerInboxTab } from '@/lib/fineract/checker-inbox-paths';
import { getServerSession } from '@/lib/session/server';

export default async function CheckerInboxPage({
  searchParams
}: {
  searchParams: Promise<{
    loanId?: string;
    clientId?: string;
    resourceId?: string;
    tab?: string;
  }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('checkerInbox'))) {
    notFound();
  }

  const query = await searchParams;
  const tab = parseCheckerInboxTab(query.tab);
  const serverFilters: CheckerInboxSearchFilters = {};
  if (query.loanId?.trim()) {
    serverFilters.loanId = query.loanId.trim();
  }
  if (query.clientId?.trim()) {
    serverFilters.clientId = query.clientId.trim();
  }
  if (query.resourceId?.trim()) {
    serverFilters.resourceId = query.resourceId.trim();
  }

  const [items, workflowRuntime] = await Promise.all([
    listCheckerInboxItems(serverFilters),
    loadApprovalWorkflowRuntimeContext()
  ]);

  const initialClientFilters = {
    ...(query.resourceId?.trim() ? { resourceId: query.resourceId.trim() } : {})
  };

  return (
    <CheckerInboxPageContent
      items={await enrichCheckerInboxItems(items, workflowRuntime)}
      taskPermissions={workflowRuntime.makerCheckerPermissions}
      approvalWorkflowsEnabled={workflowRuntime.workflowsEnabled}
      initialClientFilters={initialClientFilters}
      tab={tab}
    />
  );
}
