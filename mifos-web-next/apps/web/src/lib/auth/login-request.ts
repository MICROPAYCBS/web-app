/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import {
  authenticateFineract,
  AuthenticationError,
  toLoginErrorMessage
} from '@/lib/fineract/authenticate';
import type { TwoFactorPendingAuth } from '@/lib/session/pending-twofactor';
import type { ServerSession } from '@/lib/session/types';

export function safeLoginRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  if (value.startsWith('/login') || value.startsWith('/connect')) {
    return '/';
  }
  return value;
}

export type LoginRequestFields = {
  username: string;
  password: string;
  remember: boolean;
  redirectTo: string;
};

export function readLoginRequestFields(formData: FormData): LoginRequestFields {
  return {
    username: String(formData.get('username') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    remember: formData.get('remember') === 'on',
    redirectTo: safeLoginRedirectPath(String(formData.get('redirectTo') ?? '/'))
  };
}

export type LoginResult =
  | { ok: true; needsTwoFactor?: false; session: ServerSession; redirectTo: string; remember: boolean }
  | { ok: true; needsTwoFactor: true; pending: TwoFactorPendingAuth }
  | { ok: false; message: string };

/** Authenticate against the active Fineract server (BFF-only). */
export async function performLogin(formData: FormData): Promise<LoginResult> {
  const { username, password, remember, redirectTo } = readLoginRequestFields(formData);

  if (!username || !password) {
    return { ok: false, message: 'Username and password are required.' };
  }

  try {
    const outcome = await authenticateFineract({ username, password, remember });
    if (outcome.status === 'twoFactorRequired') {
      return {
        ok: true,
        needsTwoFactor: true,
        pending: {
          ...outcome.pendingBase,
          remember,
          redirectTo
        }
      };
    }
    return { ok: true, session: outcome.session, redirectTo, remember };
  } catch (error) {
    if (error instanceof AuthenticationError && error.code === 'INVALID_CREDENTIALS') {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: toLoginErrorMessage(error) };
  }
}
