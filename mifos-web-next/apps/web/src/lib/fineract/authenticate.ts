/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { FineractHttpError, type OtpDeliveryMethod } from '@mifos/api-client';
import { parseSessionRoles } from '@mifos/auth';
import { AuthenticationError } from '@/lib/fineract/authentication-error';
import { readFineractJsonBody } from '@/lib/fineract/fineract-response';
import { getFineractServerConfig } from '@/lib/fineract/server-config';
import { fineractFetch } from '@/lib/fineract/fineract-fetch';
import {
  deprecatedDemoFineractHint,
  getFineractApiHost,
  isDeprecatedDemoFineractHost
} from '@mifos/servers';
import type { TwoFactorPendingAuth } from '@/lib/session/pending-twofactor';
import type { ServerSession } from '@/lib/session/types';

/** Fineract POST /authentication response (subset). */
export interface FineractAuthenticationResponse {
  username: string;
  userId: number;
  base64EncodedAuthenticationKey?: string;
  accessToken?: string;
  authenticated?: boolean;
  officeId: number;
  officeName?: string;
  permissions: string[];
  roles?: unknown;
  isTwoFactorAuthenticationRequired?: boolean;
  deliveryMethod?: OtpDeliveryMethod;
  totpEnabled?: boolean;
  totpEnrollmentRequired?: boolean;
  shouldRenewPassword?: boolean;
  sessionIdleTimeoutMinutes?: number;
  sessionIdleWarningSeconds?: number;
}

export interface AuthenticateParams {
  username: string;
  password: string;
  remember?: boolean;
}

export type AuthenticateOutcome =
  | { status: 'authenticated'; session: ServerSession }
  | {
      status: 'twoFactorRequired';
      pendingBase: Omit<TwoFactorPendingAuth, 'remember' | 'redirectTo'>;
    };

export { AuthenticationError } from '@/lib/fineract/authentication-error';

export function mapAuthenticationToSession(data: FineractAuthenticationResponse): ServerSession {
  return {
    userId: data.userId,
    username: data.username,
    officeId: data.officeId,
    officeName: data.officeName,
    permissions: data.permissions ?? [],
    roles: parseSessionRoles(data.roles),
    authenticated: data.authenticated ?? true,
    base64EncodedAuthenticationKey: data.base64EncodedAuthenticationKey,
    accessToken: data.accessToken,
    sessionIdleTimeoutMinutes: data.sessionIdleTimeoutMinutes,
    sessionIdleWarningSeconds: data.sessionIdleWarningSeconds
  };
}

export function mapAuthenticationToPendingBase(
  data: FineractAuthenticationResponse
): Omit<TwoFactorPendingAuth, 'remember' | 'redirectTo'> {
  const deliveryMethod = data.deliveryMethod;
  const totpEnabled = data.totpEnabled === true;
  const totpEnrollmentRequired =
    data.totpEnrollmentRequired === true ||
    (deliveryMethod === 'totp' && !totpEnabled);

  return {
    userId: data.userId,
    username: data.username,
    officeId: data.officeId,
    officeName: data.officeName,
    base64EncodedAuthenticationKey: data.base64EncodedAuthenticationKey,
    accessToken: data.accessToken,
    shouldRenewPassword: data.shouldRenewPassword,
    sessionIdleTimeoutMinutes: data.sessionIdleTimeoutMinutes,
    sessionIdleWarningSeconds: data.sessionIdleWarningSeconds,
    deliveryMethod,
    totpEnabled,
    totpEnrollmentRequired
  };
}

/** Decode Basic auth key from POST /authentication (username:password). */
export function credentialsFromBasicAuthenticationKey(
  base64EncodedAuthenticationKey: string
): { username: string; password: string } | null {
  try {
    const decoded = Buffer.from(base64EncodedAuthenticationKey, 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator <= 0) {
      return null;
    }
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1)
    };
  } catch {
    return null;
  }
}

function invalidCredentialsMessage(
  serverName: string,
  baseUrl: string,
  tenantId: string,
  fineractMessage?: string
): string {
  const host = getFineractApiHost(baseUrl);
  const base = fineractMessage?.trim() || 'Invalid username or password.';
  let message = `${base} (${serverName} at ${host}, tenant: ${tenantId}).`;
  if (isDeprecatedDemoFineractHost(baseUrl)) {
    message += ` ${deprecatedDemoFineractHint()}`;
  } else {
    message += ' Check credentials and tenant, or edit the server URL under Manage servers.';
  }
  return message;
}

/**
 * Authenticate against the active Fineract server (BFF — never from the browser).
 * When 2FA is required, returns pending auth material instead of a full session.
 */
export async function authenticateFineract(params: AuthenticateParams): Promise<AuthenticateOutcome> {
  const { baseUrl, tenantId, serverName } = await getFineractServerConfig();
  const url = `${baseUrl.replace(/\/$/, '')}/authentication`;

  let res: Response;
  try {
    res = await fineractFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Fineract-Platform-TenantId': tenantId
      },
      body: JSON.stringify({
        username: params.username,
        password: params.password,
        remember: params.remember ?? false
      }),
      cache: 'no-store'
    });
  } catch {
    throw new AuthenticationError(
      `Could not reach ${serverName} at ${baseUrl}. Check the server URL and network.`,
      'SERVER'
    );
  }

  const responseContext = {
    requestUrl: url,
    operation: 'POST /authentication'
  };

  if (!res.ok) {
    let body: { defaultUserMessage?: string } | null = null;
    try {
      body = await readFineractJsonBody<{ defaultUserMessage?: string }>(res, responseContext);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      body = null;
    }
    if (res.status === 401 || res.status === 403) {
      throw new AuthenticationError(
        invalidCredentialsMessage(serverName, baseUrl, tenantId, body?.defaultUserMessage),
        'INVALID_CREDENTIALS'
      );
    }
    if (res.status === 404) {
      throw new AuthenticationError(
        `Sign-in URL not found for ${serverName} (${baseUrl}/authentication). Check the server API URL.`,
        'SERVER'
      );
    }
    throw new AuthenticationError(
      body?.defaultUserMessage ?? `Authentication failed for ${serverName} (HTTP ${res.status}).`,
      'SERVER'
    );
  }

  const data = await readFineractJsonBody<FineractAuthenticationResponse>(res, responseContext);

  if (!data.base64EncodedAuthenticationKey && !data.accessToken) {
    throw new AuthenticationError('Authentication response was incomplete.', 'SERVER');
  }

  if (data.isTwoFactorAuthenticationRequired) {
    return {
      status: 'twoFactorRequired',
      pendingBase: mapAuthenticationToPendingBase(data)
    };
  }

  if (data.shouldRenewPassword) {
    throw new AuthenticationError(
      'Your password has expired. Reset it with your administrator before signing in here.',
      'PASSWORD_EXPIRED'
    );
  }

  return { status: 'authenticated', session: mapAuthenticationToSession(data) };
}

/** Authenticate and require a full session (rejects when 2FA is still required). */
export async function authenticateFineractSession(params: AuthenticateParams): Promise<ServerSession> {
  const outcome = await authenticateFineract(params);
  if (outcome.status === 'twoFactorRequired') {
    throw new AuthenticationError(
      'Two-factor authentication is required. Complete the verification code step to sign in.',
      'TWO_FACTOR'
    );
  }
  return outcome.session;
}

export function toLoginErrorMessage(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return error.message;
  }
  if (error instanceof FineractHttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Sign in failed. Please try again.';
}
