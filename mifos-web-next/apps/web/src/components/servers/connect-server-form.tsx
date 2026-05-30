'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { addServerAction } from '@/actions/servers';
import { ServerForm } from '@/components/servers/server-form';

export function ConnectServerForm({ isEmpty }: { isEmpty: boolean }) {
  return (
    <ServerForm
      submitLabel={isEmpty ? 'Save and continue' : 'Add server'}
      onSubmit={(values) => addServerAction(values, { redirectToLogin: isEmpty })}
    />
  );
}
