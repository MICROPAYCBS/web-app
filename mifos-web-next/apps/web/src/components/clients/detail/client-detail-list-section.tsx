'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can, type PermissionInput } from '@mifos/auth';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { DetailSection, EmptyState } from '@/components/composites';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ClientDetailListSection({
  title,
  description,
  createAction,
  emptyMessage,
  emptyDescription,
  children
}: {
  title: string;
  description?: string;
  createAction?: {
    href: string;
    label: string;
    permission?: PermissionInput;
  };
  emptyMessage: string;
  emptyDescription?: string;
  children?: ReactNode;
}) {
  const createButton = createAction ? (
    <Link href={createAction.href} className={cn(buttonVariants({ size: 'sm' }))}>
      <Plus className="size-4" aria-hidden />
      {createAction.label}
    </Link>
  ) : null;

  const toolbar =
    createButton && createAction?.permission ? (
      <Can permission={createAction.permission}>{createButton}</Can>
    ) : (
      createButton
    );

  return (
    <DetailSection title={title} description={description} actions={toolbar ?? undefined}>
      {children ?? (
        <EmptyState title={emptyMessage} description={emptyDescription} />
      )}
    </DetailSection>
  );
}
