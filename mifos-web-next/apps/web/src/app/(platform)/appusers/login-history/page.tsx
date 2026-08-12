/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { LoginHistoryPageContent } from '@/components/app-users/login-history-page-content';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { listUsers } from '@/lib/fineract/app-users';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { parseUserSessionHistoryQuery } from '@/lib/fineract/user-session-query';
import { listUserSessionHistory } from '@/lib/fineract/user-sessions';
import { getServerSession } from '@/lib/session/server';

export default async function LoginHistoryPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.users.sessions'))) {
    notFound();
  }

  const params = await searchParams;
  const query = parseUserSessionHistoryQuery(params);
  const [historyResult, usersResult] = await Promise.all([
    tryFineractLoad(() => listUserSessionHistory(query), 'Could not load login history.'),
    tryFineractLoad(() => listUsers(), 'Could not load users.')
  ]);

  if (!historyResult.ok) {
    return (
      <ListPage
        title="Login history"
        description="Each row is a successful sign-in. Failed attempts and users who skip two-factor verification are not included."
      >
        <LoadErrorAlert title="Could not load login history" message={historyResult.message} />
      </ListPage>
    );
  }

  return (
    <LoginHistoryPageContent
      page={historyResult.data}
      query={query}
      users={usersResult.ok ? usersResult.data : []}
    />
  );
}
