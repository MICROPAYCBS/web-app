/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { getCode } from '@/lib/fineract/system-codes';
import { getServerSession } from '@/lib/session/server';

/** Legacy edit route — detail page hosts inline editing in General details. */
export default async function SystemCodeEditPage({
  params
}: {
  params: Promise<{ codeId: string }>;
}) {
  const { codeId } = await params;
  const session = await getServerSession();

  if (!can(session, 'UPDATE_CODE')) {
    notFound();
  }

  try {
    const code = await getCode(codeId);
    if (code.systemDefined) {
      notFound();
    }
  } catch {
    notFound();
  }

  return redirect(`/system/codes/${codeId}?tab=general`);
}
