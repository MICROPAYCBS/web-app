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
import { getCheckerInboxSearchTemplate, listCheckerInboxItems } from '@/lib/fineract/checker-inbox';
import { parseCheckerInboxSearchFilters } from '@/lib/fineract/checker-inbox-query';
import { getServerSession } from '@/lib/session/server';

export default async function CheckerInboxPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('checkerInbox'))) {
    notFound();
  }

  const params = await searchParams;
  const filters = parseCheckerInboxSearchFilters(params);
  const hasActiveSearch = Object.values(filters).some((value) => Boolean(value));

  const [items, template] = await Promise.all([
    listCheckerInboxItems(filters),
    getCheckerInboxSearchTemplate()
  ]);

  return (
    <CheckerInboxPageContent
      items={items}
      filters={filters}
      template={template}
      hasActiveSearch={hasActiveSearch}
    />
  );
}
