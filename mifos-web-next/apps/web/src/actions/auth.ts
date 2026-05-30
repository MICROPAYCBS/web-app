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
import {
  authenticateFineract,
  AuthenticationError,
  toLoginErrorMessage
} from '@/lib/fineract/authenticate';
import { clearSessionCookie, setSessionCookie } from '@/lib/session/cookie';

export type LoginFormState = {
  ok: boolean;
  message?: string;
};

function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  if (value.startsWith('/login') || value.startsWith('/connect')) {
    return '/';
  }
  return value;
}

/** Fineract basic auth → httpOnly session cookie. */
export async function loginAction(
  _prev: LoginFormState | null,
  formData: FormData
): Promise<LoginFormState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';
  const redirectTo = safeRedirectPath(String(formData.get('redirectTo') ?? '/'));

  if (!username || !password) {
    return { ok: false, message: 'Username and password are required.' };
  }

  try {
    const session = await authenticateFineract({ username, password, remember });
    await setSessionCookie(session, { remember });
  } catch (error) {
    if (error instanceof AuthenticationError && error.code === 'INVALID_CREDENTIALS') {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: toLoginErrorMessage(error) };
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

/**
 * Clears the httpOnly session cookie and redirects to login.
 * Server catalog is kept so the user can switch backends without re-adding URLs.
 */
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath('/', 'layout');
  redirect('/login?signedOut=1');
}
