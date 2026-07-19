'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';

/** Groups account lifecycle actions with officer assign/reassign (client-style). */
export function AccountDetailActionsBar({
  children,
  officer
}: {
  children?: ReactNode;
  officer?: ReactNode;
}) {
  if (!children && !officer) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {officer}
    </div>
  );
}
