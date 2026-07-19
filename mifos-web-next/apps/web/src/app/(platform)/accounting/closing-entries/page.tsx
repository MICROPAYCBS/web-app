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
import { ClosingEntriesPageContent } from '@/components/accounting/closing-entries-page-content';
import { GlClosureCreateUrlPanel } from '@/components/accounting/gl-closure-create-url-panel';
import { listGlClosures } from '@/lib/fineract/gl-closures';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function ClosingEntriesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.closing'))) {
    notFound();
  }

  const [closures, offices] = await Promise.all([listGlClosures(), listOfficeOptions()]);

  return (
    <>
      <ClosingEntriesPageContent closures={closures} />
      {can(session, 'CREATE_GLCLOSURE') ? (
        <Suspense fallback={null}>
          <GlClosureCreateUrlPanel offices={offices} />
        </Suspense>
      ) : null}
    </>
  );
}
