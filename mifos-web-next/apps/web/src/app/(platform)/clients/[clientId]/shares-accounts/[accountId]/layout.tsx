/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';

/** Individual share account — full-page shell, not nested in client detail. */
export default function ShareAccountDetailLayout({ children }: { children: ReactNode }) {
  return <PlatformRouteLayout>{children}</PlatformRouteLayout>;
}
