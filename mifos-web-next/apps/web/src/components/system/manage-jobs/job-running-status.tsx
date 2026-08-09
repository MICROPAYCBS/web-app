'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function JobRunningStatus({ running }: { running: boolean }) {
  if (running) {
    return (
      <Badge variant="secondary">
        <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
        Running
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Idle
    </Badge>
  );
}
