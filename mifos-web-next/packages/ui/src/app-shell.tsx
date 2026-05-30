/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';

export interface AppShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
}

/**
 * Platform layout shell — pair with shadcn Sidebar in apps/web.
 */
export function AppShell({ children, sidebar, header }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {sidebar ? (
        <aside className="hidden w-72 shrink-0 border-r border-border md:block">{sidebar}</aside>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {header ? <header className="border-b border-border">{header}</header> : null}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
