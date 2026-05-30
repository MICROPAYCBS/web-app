'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME } from '@/lib/session/constants';
import { isDemoSessionEnabled } from '@/lib/session/demo-session';
import { parseServerSessionJson } from '@/lib/session/sanitize';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

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
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, raw, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production'
  });
  redirect(redirectTo);
}
