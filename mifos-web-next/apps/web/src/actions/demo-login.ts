'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isDemoSessionEnabled } from '@/lib/session/demo-session';
import { setSessionCookie } from '@/lib/session/cookie';
import { parseServerSessionJson } from '@/lib/session/sanitize';

export async function enterDemoSessionAction(redirectTo = '/') {
  if (!isDemoSessionEnabled()) {
    throw new Error('Demo session is not enabled for this deployment');
  }
  const raw = process.env.RBAC_DEV_SESSION;
  if (!raw) {
    throw new Error('RBAC_DEV_SESSION is not configured');
  }
  const session = parseServerSessionJson(raw);
  if (!session) {
    throw new Error('Invalid RBAC_DEV_SESSION JSON');
  }
  await setSessionCookie(session);
  revalidatePath('/', 'layout');
  redirect(redirectTo);
}
