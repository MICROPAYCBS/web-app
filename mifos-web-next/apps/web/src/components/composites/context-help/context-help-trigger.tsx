'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CircleHelp } from 'lucide-react';
import { useContextHelp } from '@/components/composites/context-help/context-help-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ContextHelpTrigger({ className }: { className?: string }) {
  const { open, toggle } = useContextHelp();

  if (open) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="default"
      className={cn(
        'fixed right-6 bottom-6 z-30 h-11 gap-2 rounded-full px-4 shadow-lg',
        className
      )}
      aria-label="Open context help"
      aria-expanded={false}
      aria-controls="context-help-panel"
      onClick={toggle}
    >
      <CircleHelp className="size-4" />
      <span className="text-sm font-medium">Help</span>
    </Button>
  );
}
