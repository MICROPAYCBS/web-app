/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { cookies } from 'next/headers';
import type { OtpDeliveryMethod } from '@mifos/api-client';
import { TWO_FACTOR_PENDING_COOKIE_NAME, TWO_FACTOR_PENDING_MAX_AGE } from './constants';

export { TWO_FACTOR_PENDING_COOKIE_NAME, TWO_FACTOR_PENDING_MAX_AGE };

/**
 * Short-lived state after password login when OTP is still required.
 * Intentionally omits permissions/roles — those blow past browser cookie size
 * limits for ALL_FUNCTIONS users. Hydrate them after OTP via re-authentication.
 */
export type TwoFactorPendingAuth = {
  base64EncodedAuthenticationKey?: string;
  accessToken?: string;
  username: string;
  userId: number;
  officeId: number;
  officeName?: string;
  remember: boolean;
  shouldRenewPassword?: boolean;
  sessionIdleTimeoutMinutes?: number;
  sessionIdleWarningSeconds?: number;
  redirectTo: string;
  /** Global delivery method from POST /authentication. */
  deliveryMethod?: OtpDeliveryMethod;
  totpEnabled?: boolean;
  totpEnrollmentRequired?: boolean;
};

export function twoFactorPendingCookieAttributes(maxAge: number) {
  return {
    name: TWO_FACTOR_PENDING_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    secure: process.env.NODE_ENV === 'production'
  };
}

export function parseTwoFactorPendingAuth(raw: string | null | undefined): TwoFactorPendingAuth | null {
  if (!raw) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as TwoFactorPendingAuth;
    if (
      !data ||
      typeof data.userId !== 'number' ||
      typeof data.username !== 'string' ||
      typeof data.officeId !== 'number' ||
      (!data.base64EncodedAuthenticationKey && !data.accessToken)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function getTwoFactorPendingAuth(): Promise<TwoFactorPendingAuth | null> {
  const cookieStore = await cookies();
  return parseTwoFactorPendingAuth(cookieStore.get(TWO_FACTOR_PENDING_COOKIE_NAME)?.value);
}

export async function clearTwoFactorPendingCookie(): Promise<void> {
  const cookieStore = await cookies();
  const attrs = twoFactorPendingCookieAttributes(0);
  cookieStore.set(attrs.name, '', {
    ...attrs,
    maxAge: 0,
    expires: new Date(0)
  });
}
