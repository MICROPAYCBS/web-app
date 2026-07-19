'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CenterDetail } from '@mifos/api-client';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { DetailBackLink, DetailHeader } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { centerStatusVariant, formatCenterDate } from '@/lib/fineract/center-display';
import { centerEditPath, CENTERS_LIST_PATH } from '@/lib/fineract/center-paths';
import { cn } from '@/lib/utils';

export function CenterDetailTop({ center, canEdit }: { center: CenterDetail; canEdit: boolean }) {
  return (
    <DetailHeader
      backLink={<DetailBackLink href={CENTERS_LIST_PATH} label="Back to centers" />}
      title={
        <span className="inline-flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground" aria-hidden />
          {center.name}
          <Badge variant={centerStatusVariant(center.status?.code)}>
            {center.status?.value ?? 'Unknown'}
          </Badge>
        </span>
      }
      meta={
        <span className="space-y-1 text-sm text-muted-foreground">
          <span className="block">Account #: {center.accountNo ?? '—'}</span>
          <span className="block">Branch: {center.officeName ?? '—'}</span>
          {center.externalId ? (
            <span className="block">External ID: {center.externalId}</span>
          ) : null}
          {center.staffName ? <span className="block">Staff: {center.staffName}</span> : null}
          <span className="block">Activation date: {formatCenterDate(center.activationDate)}</span>
        </span>
      }
      actions={
        canEdit ? (
          <Link
            href={centerEditPath(center.id)}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Edit
          </Link>
        ) : null
      }
    />
  );
}
