/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';

export interface PlatformNavItem {
  href: string;
  label: string;
}

export function PlatformSidebar({ items }: { items: PlatformNavItem[] }) {
  return (
    <nav className="flex flex-col gap-1 p-4">
      <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Mifos
      </p>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
