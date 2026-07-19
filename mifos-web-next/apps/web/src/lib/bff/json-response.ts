import 'server-only';

import { FineractHttpError } from '@mifos/api-client';
import { getFineractErrorMessage } from '@mifos/i18n';
import { NextResponse } from 'next/server';

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(error: unknown) {
  if (error instanceof FineractHttpError) {
    const message = getFineractErrorMessage(error.body, error.status);
    return NextResponse.json(
      {
        ...(error.body ?? {}),
        message
      },
      { status: error.status }
    );
  }
  console.error('[BFF]', error);
  return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
}
