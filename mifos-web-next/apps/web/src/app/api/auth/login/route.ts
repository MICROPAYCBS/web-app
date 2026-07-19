import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { LoginApiFailure, LoginApiSuccess } from '@/lib/auth/login-api';
import { performLogin, safeLoginRedirectPath } from '@/lib/auth/login-request';
import { loginRedirectWithError } from '@/lib/auth/login-error-flash';
import { wantsJsonLoginResponse } from '@/lib/auth/login-api-server';
import { sessionCookieAttributes } from '@/lib/session/cookie-options';

export const dynamic = 'force-dynamic';

function loginPageUrl(request: NextRequest, options: { from?: string; error?: string }) {
  const url = new URL('/login', request.url);
  if (options.from && options.from !== '/') {
    url.searchParams.set('from', options.from);
  }
  if (options.error) {
    url.searchParams.set('error', options.error);
  }
  return url;
}

/**
 * Fineract sign-in via standard form POST — Set-Cookie on redirect (reliable on Vercel).
 * Prefer this over server-action login; FormData is read from the request body.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const redirectTo = safeLoginRedirectPath(String(formData.get('redirectTo') ?? '/'));
  const jsonResponse = wantsJsonLoginResponse(request);
  const result = await performLogin(formData);

  if (!result.ok) {
    if (jsonResponse) {
      const body: LoginApiFailure = { ok: false, message: result.message };
      const status = result.message === 'Username and password are required.' ? 400 : 401;
      return NextResponse.json(body, { status });
    }
    return loginRedirectWithError(
      request,
      loginPageUrl(request, { from: redirectTo }),
      result.message
    );
  }

  revalidatePath('/', 'layout');

  const maxAge = result.remember ? 60 * 60 * 24 * 14 : 60 * 60 * 8;
  const attrs = sessionCookieAttributes(maxAge);

  if (jsonResponse) {
    const body: LoginApiSuccess = { ok: true, redirectTo: result.redirectTo };
    const response = NextResponse.json(body);
    response.cookies.set(attrs.name, JSON.stringify(result.session), attrs);
    return response;
  }

  const response = NextResponse.redirect(new URL(result.redirectTo, request.url));
  response.cookies.set(attrs.name, JSON.stringify(result.session), attrs);
  return response;
}
