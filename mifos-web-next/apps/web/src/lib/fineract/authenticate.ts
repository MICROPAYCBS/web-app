import 'server-only';

import { FineractHttpError } from '@mifos/api-client';
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
  shouldRenewPassword?: boolean;
  sessionIdleTimeoutMinutes?: number;
  sessionIdleWarningSeconds?: number;
}

export interface AuthenticateParams {
  username: string;
  password: string;
  remember?: boolean;
}

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
 */
export async function authenticateFineract(params: AuthenticateParams): Promise<ServerSession> {
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

  if (data.isTwoFactorAuthenticationRequired) {
    throw new AuthenticationError(
      'Two-factor authentication is required. This client does not support 2FA yet.',
      'TWO_FACTOR'
    );
  }

  if (data.shouldRenewPassword) {
    throw new AuthenticationError(
      'Your password has expired. Reset it with your administrator before signing in here.',
      'PASSWORD_EXPIRED'
    );
  }

  if (!data.base64EncodedAuthenticationKey && !data.accessToken) {
    throw new AuthenticationError('Authentication response was incomplete.', 'SERVER');
  }

  return mapAuthenticationToSession(data);
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
