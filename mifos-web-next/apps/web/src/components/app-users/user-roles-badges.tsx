'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserRoleRef } from '@mifos/api-client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function UserRolesBadges({
  roles,
  linkToRole = true,
  emptyLabel = 'No roles assigned'
}: {
  roles: FineractUserRoleRef[];
  linkToRole?: boolean;
  emptyLabel?: string;
}) {
  if (!roles.length) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) =>
        linkToRole ? (
          <Link
            key={role.id}
            href={`/system/roles-and-permissions/${role.id}`}
            className="inline-flex"
          >
            <Badge variant="secondary" className="hover:bg-secondary/80">
              {role.name}
            </Badge>
          </Link>
        ) : (
          <Badge key={role.id} variant="secondary">
            {role.name}
          </Badge>
        )
      )}
    </div>
  );
}
