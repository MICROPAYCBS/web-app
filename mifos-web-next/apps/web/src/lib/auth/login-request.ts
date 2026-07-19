import 'server-only';

import {
  authenticateFineract,
  AuthenticationError,
  toLoginErrorMessage
} from '@/lib/fineract/authenticate';
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
  | { ok: true; session: ServerSession; redirectTo: string; remember: boolean }
  | { ok: false; message: string };

/** Authenticate against the active Fineract server (BFF-only). */
export async function performLogin(formData: FormData): Promise<LoginResult> {
  const { username, password, remember, redirectTo } = readLoginRequestFields(formData);

  if (!username || !password) {
    return { ok: false, message: 'Username and password are required.' };
  }

  try {
    const session = await authenticateFineract({ username, password, remember });
    return { ok: true, session, redirectTo, remember };
  } catch (error) {
    if (error instanceof AuthenticationError && error.code === 'INVALID_CREDENTIALS') {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: toLoginErrorMessage(error) };
  }
}
