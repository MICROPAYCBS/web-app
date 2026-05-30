/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AppShell } from '@mifos/ui';
import { PlatformHeader } from '@/components/platform/platform-header';
import { PlatformSidebar } from '@/components/platform/platform-sidebar';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebar={<PlatformSidebar />} header={<PlatformHeader />}>
      {children}
    </AppShell>
  );
}
