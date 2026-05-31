'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Search } from 'lucide-react';
import { useNavigation } from '@/components/platform/navigation-provider';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';

/** Vercel-style find field at the top of the sidebar nav stack. */
export function SidebarNavFind() {
  const { findQuery, setFindQuery, findInputRef } = useNavigation();

  return (
    <div className="relative px-2 pb-2">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={findInputRef}
        type="search"
        value={findQuery}
        onChange={(e) => setFindQuery(e.target.value)}
        placeholder="Find…"
        data-slot="sidebar-input"
        data-sidebar="input"
        className="h-8 w-full bg-background pl-8 pr-10 shadow-none"
        aria-label="Find navigation"
        autoComplete="off"
        spellCheck={false}
      />
      <div className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 items-center">
        <Kbd className="text-[10px]">F</Kbd>
      </div>
    </div>
  );
}
