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
import { performLogin } from '@/lib/auth/login-request';
import { setSessionCookie } from '@/lib/session/cookie';

export type LoginFormState = {
  ok: boolean;
  message?: string;
  redirectTo?: string;
};

/**
 * @deprecated Prefer POST /api/auth/login (see login form). Server actions can
 * mis-serialize FormData when used with useActionState.
 */
export async function loginAction(
  _prev: LoginFormState | null,
  formData: FormData
): Promise<LoginFormState> {
  const result = await performLogin(formData);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  await setSessionCookie(result.session, { remember: result.remember });
  revalidatePath('/', 'layout');
  return { ok: true, redirectTo: result.redirectTo };
}

/**
 * @deprecated Prefer navigation to `/api/auth/logout` (see `SignOutButton`).
 */
export async function logoutAction(): Promise<void> {
  redirect('/api/auth/logout');
}
