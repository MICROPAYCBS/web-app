'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { GroupDetail } from '@mifos/api-client';
import Link from 'next/link';
import { UsersRound } from 'lucide-react';
import { DetailBackLink, DetailHeader } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatGroupDate, groupStatusVariant } from '@/lib/fineract/group-display';
import { groupEditPath, GROUPS_LIST_PATH } from '@/lib/fineract/group-paths';
import { cn } from '@/lib/utils';

export function GroupDetailTop({ group, canEdit }: { group: GroupDetail; canEdit: boolean }) {
  return (
    <DetailHeader
      backLink={<DetailBackLink href={GROUPS_LIST_PATH} label="Back to groups" />}
      title={
        <span className="inline-flex items-center gap-2">
          <UsersRound className="size-5 text-muted-foreground" aria-hidden />
          {group.name}
          <Badge variant={groupStatusVariant(group.status?.code)}>
            {group.status?.value ?? 'Unknown'}
          </Badge>
        </span>
      }
      meta={
        <span className="space-y-1 text-sm text-muted-foreground">
          <span className="block">Account #: {group.accountNo ?? '—'}</span>
          <span className="block">Branch: {group.officeName ?? '—'}</span>
          {group.externalId ? (
            <span className="block">External ID: {group.externalId}</span>
          ) : null}
          {group.staffName ? <span className="block">Staff: {group.staffName}</span> : null}
          <span className="block">Activation date: {formatGroupDate(group.activationDate)}</span>
        </span>
      }
      actions={
        canEdit ? (
          <Link
            href={groupEditPath(group.id)}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Edit
          </Link>
        ) : null
      }
    />
  );
}
