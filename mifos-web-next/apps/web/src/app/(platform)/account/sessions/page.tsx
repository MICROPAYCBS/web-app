/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { redirect } from 'next/navigation';
import { UserSessionsTable } from '@/components/app-users/user-sessions-table';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { listUserSessions } from '@/lib/fineract/user-sessions';
import { getServerSession } from '@/lib/session/server';

export default async function MySessionsPage() {
  const session = await getServerSession();
  if (!session?.userId) {
    redirect('/login');
  }

  const result = await tryFineractLoad(
    () => listUserSessions(session.userId),
    'Could not load your sessions.'
  );
  const canRevoke = can(session, resolvePermission('administration.users.sessions.revoke'));

  return (
    <ListPage
      title="My sessions"
      description="Sign-ins on this account. Report any device you do not recognise."
    >
      {result.ok ? (
        <UserSessionsTable
          sessions={result.data}
          canRevoke={canRevoke}
          stickyHeader
          emptyMessage="No active sessions."
        />
      ) : (
        <LoadErrorAlert title="Could not load sessions" message={result.message} />
      )}
    </ListPage>
  );
}
