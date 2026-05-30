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
import { setSessionCookie } from '@/lib/session/cookie';

export type LoginFormState = {
  ok: boolean;
  message?: string;
  /** Set on success; client performs full navigation. */
  redirectTo?: string;
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

function resolveFormData(
  prev: LoginFormState | FormData | null,
  formDataMaybe?: FormData
): FormData | null {
  if (prev instanceof FormData) {
    return prev;
  }
  if (formDataMaybe instanceof FormData) {
    return formDataMaybe;
  }
  return null;
}

function readLoginFields(formData: FormData) {
  return {
    username: String(formData.get('username') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    remember: formData.get('remember') === 'on',
    redirectTo: safeRedirectPath(String(formData.get('redirectTo') ?? '/'))
  };
}

/** Fineract basic auth → httpOnly session cookie. Use with useActionState + form action. */
export async function loginAction(
  prev: LoginFormState | FormData | null,
  formDataMaybe?: FormData
): Promise<LoginFormState> {
  const formData = resolveFormData(prev, formDataMaybe);
  if (!formData) {
    return { ok: false, message: 'Invalid form submission.' };
  }

  const { username, password, remember, redirectTo } = readLoginFields(formData);

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
  return { ok: true, redirectTo };
}

/**
 * @deprecated Prefer navigation to `/api/auth/logout` (see `SignOutButton`).
 * Kept for any legacy forms still posting to this action.
 */
export async function logoutAction(): Promise<void> {
  redirect('/api/auth/logout');
}
