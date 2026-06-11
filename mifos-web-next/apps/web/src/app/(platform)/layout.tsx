/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { filterNavStructure } from '@mifos/auth';
import { buildNavStructure } from '@mifos/routes/server';
import { PlatformShell } from '@/components/platform/platform-shell';
import type { PlatformNavStructure } from '@/components/platform/navigation-types';
import { enrichSessionUser } from '@/lib/fineract/fetch-user-profile';
import { getPublicSession } from '@/lib/session/server';
import { getActiveFineractServer } from '@/lib/servers/catalog-store';
import { isRbacEnabled } from '@/lib/session/dev-user';
import { SessionProvider } from '@/providers/session-provider';

function toPlatformNav(structure: ReturnType<typeof buildNavStructure>): PlatformNavStructure {
  const mapLink = (item: (typeof structure.featured)[number]) => ({
    id: item.id,
    href: item.href,
    label: item.label,
    icon: item.icon,
    status: item.status,
    parityStatus: item.parityStatus,
    keywords: item.keywords
  });
  return {
    featured: structure.featured.map(mapLink),
    groups: structure.groups.map((g) => ({
      id: g.id,
      label: g.label,
      icon: g.icon,
      defaultOpen: g.defaultOpen,
      items: g.items.map(mapLink)
    })),
    quickFind: structure.quickFind.map(mapLink)
  };
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getPublicSession();
  const user = sessionUser ? await enrichSessionUser(sessionUser) : null;
  const activeServer = await getActiveFineractServer();
  const nav = toPlatformNav(filterNavStructure(user, buildNavStructure()));

  return (
    <SessionProvider user={user} rbacEnabled={isRbacEnabled()}>
      <PlatformShell nav={nav} serverName={activeServer?.name}>
        {children}
      </PlatformShell>
    </SessionProvider>
  );
}
