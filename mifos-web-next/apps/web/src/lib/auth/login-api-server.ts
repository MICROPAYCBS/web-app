import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { NextRequest } from 'next/server';
import { LOGIN_JSON_ACCEPT } from '@/lib/auth/login-api';

export function wantsJsonLoginResponse(request: NextRequest): boolean {
  return (request.headers.get('accept') ?? '').includes(LOGIN_JSON_ACCEPT);
}
