import { NextResponse } from 'next/server';
import {
  LOGIN_ERROR_DETAIL_COOKIE,
  LOGIN_ERROR_FLASH_COOKIE_OPTIONS
} from '@/lib/auth/login-error-flash';

export const dynamic = 'force-dynamic';

/** Clear the one-time login troubleshooting cookie (httpOnly — must be a Route Handler). */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOGIN_ERROR_DETAIL_COOKIE, '', {
    ...LOGIN_ERROR_FLASH_COOKIE_OPTIONS,
    maxAge: 0
  });
  return response;
}
