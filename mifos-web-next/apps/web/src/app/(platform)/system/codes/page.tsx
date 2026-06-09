/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SystemCodeCreateUrlPanel } from '@/components/system/system-code-create-url-panel';
import { SystemCodesPageContent } from '@/components/system/system-codes-page-content';
import { listCodes } from '@/lib/fineract/system-codes';
import { getServerSession } from '@/lib/session/server';

export default async function SystemCodesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.codes'))) {
    notFound();
  }

  const canCreate = can(session, 'CREATE_CODE');
  const codes = await listCodes();

  return (
    <>
      <SystemCodesPageContent codes={codes} />
      {canCreate ? (
        <Suspense fallback={null}>
          <SystemCodeCreateUrlPanel />
        </Suspense>
      ) : null}
    </>
  );
}
