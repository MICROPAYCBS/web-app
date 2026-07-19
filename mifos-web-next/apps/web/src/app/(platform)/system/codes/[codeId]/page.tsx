/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SystemCodeDetailView } from '@/components/system/system-code-detail-view';
import { getCode, listCodeValues } from '@/lib/fineract/system-codes';
import { getServerSession } from '@/lib/session/server';

export default async function SystemCodeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ codeId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { codeId } = await params;
  const { tab } = await searchParams;
  const session = await getServerSession();

  if (!can(session, resolvePermission('system.codes'))) {
    notFound();
  }

  let code;
  let codeValues;
  try {
    [code, codeValues] = await Promise.all([
      getCode(codeId),
      listCodeValues(codeId).catch(() => [])
    ]);
  } catch {
    notFound();
  }

  const defaultTab = tab === 'general' ? 'general' : 'values';

  return (
    <SystemCodeDetailView
      code={code}
      codeValues={codeValues}
      canDeleteCode={can(session, 'DELETE_CODEVALUE')}
      defaultTab={defaultTab}
    />
  );
}
