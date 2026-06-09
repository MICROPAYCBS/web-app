/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';

/** Pass-through: client detail shell lives in `(detail)/layout`; loan applications use their own layout. */
export default function ClientSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
