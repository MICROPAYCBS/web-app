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
import { cn } from '@/lib/utils';

/** Vercel-style find field — full width of sidebar header action stack (matches Quick Create). */
export function SidebarNavFind({ className }: { className?: string }) {
  const { findQuery, setFindQuery, findInputRef } = useNavigation();

  return (
    <div className={cn('relative flex w-full items-center', className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
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
        className="h-8 w-full bg-background pl-8 pr-9 shadow-none"
        aria-label="Find navigation"
        autoComplete="off"
        spellCheck={false}
      />
      <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center justify-center">
        <Kbd className="text-[10px]">F</Kbd>
      </div>
    </div>
  );
}
