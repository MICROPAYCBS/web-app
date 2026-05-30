/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can, resolvePermission } from '@mifos/auth';
import { Button } from '@/components/ui/button';

export default function ClientsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
        <Can permission={resolvePermission('clients.create')}>
          <Button type="button" disabled>
            New client (coming soon)
          </Button>
        </Can>
      </div>
      <p className="text-muted-foreground">
        Client list will be implemented here. The &quot;New client&quot; button is visible only with{' '}
        <code className="text-sm">CREATE_CLIENT</code> (or superuser permissions).
      </p>
    </div>
  );
}
