/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import {
  credentialsFromBasicAuthenticationKey,
  mapAuthenticationToSession,
  type FineractAuthenticationResponse
} from '@/lib/fineract/authenticate';
import { readFineractJsonBody } from '@/lib/fineract/fineract-response';
import { fineractFetch } from '@/lib/fineract/fineract-fetch';
import { getFineractServerConfig } from '@/lib/fineract/server-config';
import type { TwoFactorPendingAuth } from '@/lib/session/pending-twofactor';
import type { ServerSession } from '@/lib/session/types';

export type TwoFactorDeliveryMethod = {
  name: string;
  target?: string;
};

export type TwoFactorOtpRequestResult = {
  tokenLiveTimeInSec?: number;
  extendedAccessToken?: boolean;
  deliveryMethod?: TwoFactorDeliveryMethod;
};

export type TwoFactorValidateResult = {
  token: string;
  validFrom?: string;
  validTo?: string;
};

function pendingAuthHeader(pending: TwoFactorPendingAuth): string | null {
  if (pending.accessToken) {
    return `Bearer ${pending.accessToken}`;
  }
  if (pending.base64EncodedAuthenticationKey) {
    return `Basic ${pending.base64EncodedAuthenticationKey}`;
  }
  return null;
}

function sessionAuthHeader(session: Pick<ServerSession, 'accessToken' | 'base64EncodedAuthenticationKey'>): string | null {
  if (session.accessToken) {
    return `Bearer ${session.accessToken}`;
  }
  if (session.base64EncodedAuthenticationKey) {
    return `Basic ${session.base64EncodedAuthenticationKey}`;
  }
  return null;
}

async function fineractTwoFactorFetch(
  pathWithQuery: string,
  authHeader: string,
  init?: RequestInit
): Promise<Response> {
  const { baseUrl, tenantId } = await getFineractServerConfig();
  const url = `${baseUrl.replace(/\/$/, '')}/${pathWithQuery.replace(/^\//, '')}`;
  const headers = new Headers(init?.headers);
  headers.set('Fineract-Platform-TenantId', tenantId);
  headers.set('Authorization', authHeader);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fineractFetch(url, {
    ...init,
    headers,
    cache: 'no-store'
  });
}

function userFacingTwoFactorError(status: number, body: { defaultUserMessage?: string } | null): string {
  const message = body?.defaultUserMessage?.trim();
  if (message) {
    return message;
  }
  if (status === 401 || status === 403) {
    return 'Your sign-in session expired. Sign in again.';
  }
  return 'Two-factor verification failed. Please try again.';
}

export async function listTwoFactorDeliveryMethods(
  pending: TwoFactorPendingAuth
): Promise<{ ok: true; methods: TwoFactorDeliveryMethod[] } | { ok: false; message: string }> {
  const auth = pendingAuthHeader(pending);
  if (!auth) {
    return { ok: false, message: 'Your sign-in session expired. Sign in again.' };
  }

  let res: Response;
  try {
    res = await fineractTwoFactorFetch('twofactor', auth, { method: 'GET' });
  } catch {
    return { ok: false, message: 'Could not reach the server. Check your connection and try again.' };
  }

  if (!res.ok) {
    let body: { defaultUserMessage?: string } | null = null;
    try {
      body = await readFineractJsonBody<{ defaultUserMessage?: string }>(res, {
        requestUrl: 'twofactor',
        operation: 'GET /twofactor'
      });
    } catch {
      body = null;
    }
    return { ok: false, message: userFacingTwoFactorError(res.status, body) };
  }

  const data = await readFineractJsonBody<TwoFactorDeliveryMethod[] | { pageItems?: TwoFactorDeliveryMethod[] }>(
    res,
    { requestUrl: 'twofactor', operation: 'GET /twofactor' }
  );
  const methods = Array.isArray(data) ? data : (data.pageItems ?? []);
  return { ok: true, methods };
}

export async function requestTwoFactorOtp(
  pending: TwoFactorPendingAuth,
  deliveryMethod: string
): Promise<{ ok: true; result: TwoFactorOtpRequestResult } | { ok: false; message: string }> {
  const auth = pendingAuthHeader(pending);
  if (!auth) {
    return { ok: false, message: 'Your sign-in session expired. Sign in again.' };
  }

  const params = new URLSearchParams({
    deliveryMethod,
    extendedToken: String(pending.remember)
  });

  let res: Response;
  try {
    res = await fineractTwoFactorFetch(`twofactor?${params.toString()}`, auth, {
      method: 'POST',
      body: '{}'
    });
  } catch {
    return { ok: false, message: 'Could not reach the server. Check your connection and try again.' };
  }

  if (!res.ok) {
    let body: { defaultUserMessage?: string } | null = null;
    try {
      body = await readFineractJsonBody<{ defaultUserMessage?: string }>(res, {
        requestUrl: 'twofactor',
        operation: 'POST /twofactor'
      });
    } catch {
      body = null;
    }
    return { ok: false, message: userFacingTwoFactorError(res.status, body) };
  }

  const result = await readFineractJsonBody<TwoFactorOtpRequestResult>(res, {
    requestUrl: 'twofactor',
    operation: 'POST /twofactor'
  });
  return { ok: true, result };
}

export async function validateTwoFactorOtp(
  pending: TwoFactorPendingAuth,
  token: string
): Promise<
  | { ok: true; session: ServerSession; remember: boolean; redirectTo: string }
  | { ok: false; message: string; passwordExpired?: boolean }
> {
  const auth = pendingAuthHeader(pending);
  if (!auth) {
    return { ok: false, message: 'Your sign-in session expired. Sign in again.' };
  }

  const params = new URLSearchParams({ token });
  let res: Response;
  try {
    res = await fineractTwoFactorFetch(`twofactor/validate?${params.toString()}`, auth, {
      method: 'POST',
      body: '{}'
    });
  } catch {
    return { ok: false, message: 'Could not reach the server. Check your connection and try again.' };
  }

  if (!res.ok) {
    let body: { defaultUserMessage?: string } | null = null;
    try {
      body = await readFineractJsonBody<{ defaultUserMessage?: string }>(res, {
        requestUrl: 'twofactor/validate',
        operation: 'POST /twofactor/validate'
      });
    } catch {
      body = null;
    }
    return { ok: false, message: userFacingTwoFactorError(res.status, body) };
  }

  const access = await readFineractJsonBody<TwoFactorValidateResult>(res, {
    requestUrl: 'twofactor/validate',
    operation: 'POST /twofactor/validate'
  });

  if (!access?.token) {
    return { ok: false, message: 'Verification response was incomplete. Please try again.' };
  }

  if (pending.shouldRenewPassword) {
    return {
      ok: false,
      passwordExpired: true,
      message:
        'Your password has expired. Reset it with your administrator before signing in here.'
    };
  }

  // Pending cookie omits permissions (cookie size). Re-authenticate to hydrate RBAC.
  const session = await hydrateSessionAfterTwoFactor(pending, access);
  if (!session) {
    return {
      ok: false,
      message: 'Verification succeeded but session setup failed. Sign in again.'
    };
  }

  return {
    ok: true,
    session,
    remember: pending.remember,
    redirectTo: pending.redirectTo
  };
}

async function hydrateSessionAfterTwoFactor(
  pending: TwoFactorPendingAuth,
  access: TwoFactorValidateResult
): Promise<ServerSession | null> {
  if (pending.base64EncodedAuthenticationKey) {
    const credentials = credentialsFromBasicAuthenticationKey(
      pending.base64EncodedAuthenticationKey
    );
    if (credentials) {
      const snapshot = await fetchAuthenticationSnapshot(credentials, pending.remember);
      if (snapshot) {
        return {
          ...mapAuthenticationToSession(snapshot),
          twoFactorAccessToken: access.token,
          twoFactorValidTo: access.validTo
        };
      }
    }
  }

  // Last resort: session without permission codes (RBAC will be limited).
  return {
    userId: pending.userId,
    username: pending.username,
    officeId: pending.officeId,
    officeName: pending.officeName,
    permissions: [],
    authenticated: true,
    base64EncodedAuthenticationKey: pending.base64EncodedAuthenticationKey,
    accessToken: pending.accessToken,
    sessionIdleTimeoutMinutes: pending.sessionIdleTimeoutMinutes,
    sessionIdleWarningSeconds: pending.sessionIdleWarningSeconds,
    twoFactorAccessToken: access.token,
    twoFactorValidTo: access.validTo
  };
}

async function fetchAuthenticationSnapshot(
  credentials: { username: string; password: string },
  remember: boolean
): Promise<FineractAuthenticationResponse | null> {
  const { baseUrl, tenantId } = await getFineractServerConfig();
  const url = `${baseUrl.replace(/\/$/, '')}/authentication`;
  try {
    const res = await fineractFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Fineract-Platform-TenantId': tenantId
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        remember
      }),
      cache: 'no-store'
    });
    if (!res.ok) {
      return null;
    }
    return await readFineractJsonBody<FineractAuthenticationResponse>(res, {
      requestUrl: url,
      operation: 'POST /authentication'
    });
  } catch {
    return null;
  }
}

/** Best-effort invalidate of the TFA access token on sign-out. */
export async function invalidateTwoFactorAccessToken(
  session: Pick<ServerSession, 'accessToken' | 'base64EncodedAuthenticationKey' | 'twoFactorAccessToken'>
): Promise<void> {
  if (!session.twoFactorAccessToken) {
    return;
  }
  const auth = sessionAuthHeader(session);
  if (!auth) {
    return;
  }
  try {
    await fineractTwoFactorFetch('twofactor/invalidate', auth, {
      method: 'POST',
      body: JSON.stringify({ token: session.twoFactorAccessToken })
    });
  } catch {
    // Ignore — cookie clear still proceeds.
  }
}
