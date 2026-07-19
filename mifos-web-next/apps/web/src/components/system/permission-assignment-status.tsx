'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PermissionAssignmentStatus({
  active,
  activeLabel,
  inactiveLabel
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Lock className="size-3.5 text-muted-foreground" aria-hidden />
      <Badge variant={active ? 'default' : 'secondary'}>
        {active ? activeLabel : inactiveLabel}
      </Badge>
      <span className="sr-only">Read-only until edit mode</span>
    </div>
  );
}
