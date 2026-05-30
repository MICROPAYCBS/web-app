import 'server-only';

import { FineractHttpError } from '@mifos/api-client';
import { getFineractServerConfig } from '@/lib/fineract/server-config';
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
}

export interface AuthenticateParams {
  username: string;
  password: string;
  remember?: boolean;
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code?: 'INVALID_CREDENTIALS' | 'TWO_FACTOR' | 'PASSWORD_EXPIRED' | 'SERVER'
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export function mapAuthenticationToSession(data: FineractAuthenticationResponse): ServerSession {
  return {
    userId: data.userId,
    username: data.username,
    officeId: data.officeId,
    officeName: data.officeName,
    permissions: data.permissions ?? [],
    roles: data.roles,
    authenticated: data.authenticated ?? true,
    base64EncodedAuthenticationKey: data.base64EncodedAuthenticationKey,
    accessToken: data.accessToken
  };
}

function invalidCredentialsMessage(serverName: string, tenantId: string, fineractMessage?: string): string {
  const base = fineractMessage?.trim() || 'Invalid username or password.';
  return `${base} (${serverName}, tenant: ${tenantId}). Confirm credentials, tenant, and server URL — host-only URLs like https://my-server are OK and match the legacy web app.`;
}

/**
 * Authenticate against the active Fineract server (BFF — never from the browser).
 */
export async function authenticateFineract(
  params: AuthenticateParams
): Promise<ServerSession> {
  const { baseUrl, tenantId, serverName } = await getFineractServerConfig();
  const url = `${baseUrl.replace(/\/$/, '')}/authentication`;

  let res: Response;
  try {
    res = await fetch(url, {
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

  if (!res.ok) {
    let body: { defaultUserMessage?: string } | null = null;
    try {
      body = (await res.json()) as { defaultUserMessage?: string };
    } catch {
      body = null;
    }
    if (res.status === 401 || res.status === 403) {
      throw new AuthenticationError(
        invalidCredentialsMessage(serverName, tenantId, body?.defaultUserMessage),
        'INVALID_CREDENTIALS'
      );
    }
    if (res.status === 404) {
      throw new AuthenticationError(
        `Fineract sign-in URL not found for ${serverName} (${baseUrl}/authentication). Check the API base URL.`,
        'SERVER'
      );
    }
    throw new AuthenticationError(
      body?.defaultUserMessage ?? `Authentication failed for ${serverName} (HTTP ${res.status}).`,
      'SERVER'
    );
  }

  const data = (await res.json()) as FineractAuthenticationResponse;

  if (data.isTwoFactorAuthenticationRequired) {
    throw new AuthenticationError(
      'Two-factor authentication is required. This client does not support 2FA yet.',
      'TWO_FACTOR'
    );
  }

  if (data.shouldRenewPassword) {
    throw new AuthenticationError(
      'Your password has expired. Reset it in Fineract before signing in here.',
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
