/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SessionUser } from '@mifos/auth';
import { isDemoSessionEnabled } from './demo-session';
import { parseServerSessionJson, toPublicSession } from './sanitize';
import type { ServerSession } from './types';

export function getDevServerSession(): ServerSession | null {
  const raw = process.env.RBAC_DEV_SESSION;
  if (!raw) {
    return null;
  }
  if (process.env.NODE_ENV !== 'production') {
    return parseServerSessionJson(raw);
  }
  if (isDemoSessionEnabled()) {
    return parseServerSessionJson(raw);
  }
  return null;
}

/** @deprecated Use getDevServerSession — kept for middleware env parity */
export function getDevSessionUser(): SessionUser | null {
  return toPublicSession(getDevServerSession());
}

export function isRbacEnabled(): boolean {
  return process.env.RBAC_ENABLED !== 'false';
}
