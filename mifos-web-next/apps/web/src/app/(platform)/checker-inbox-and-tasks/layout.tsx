/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';

/** Flex chain from @container/main into ListPage / DetailPage shells. */
export default function CheckerInboxAndTasksSegmentLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
