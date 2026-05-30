import 'server-only';

import { FineractHttpError } from '@mifos/api-client';
import { NextResponse } from 'next/server';

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(error: unknown) {
  if (error instanceof FineractHttpError) {
    return NextResponse.json(error.body ?? { message: error.message }, {
      status: error.status
    });
  }
  console.error('[BFF]', error);
  return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
}
