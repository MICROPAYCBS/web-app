'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can, type PermissionInput } from '@mifos/auth';
import type { LucideIcon } from 'lucide-react';
import { CalendarClock, Landmark, PiggyBank, Plus, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  ClientAccountsTable,
  type ClientAccountRow
} from '@/components/clients/detail/client-accounts-table';
import { DetailSection, EmptyState } from '@/components/composites';
import { buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type ClientAccountListKind =
  | 'savings'
  | 'loan'
  | 'share'
  | 'fixed-deposit'
  | 'recurring-deposit';

const ACCOUNT_EMPTY_ICONS: Record<ClientAccountListKind, LucideIcon> = {
  savings: PiggyBank,
  loan: Landmark,
  share: Share2,
  'fixed-deposit': CalendarClock,
  'recurring-deposit': CalendarClock
};

export function ClientAccountsSection({
  title,
  description,
  openRows,
  closedRows,
  openEmptyMessage,
  openEmptyDescription,
  closedEmptyMessage,
  closedEmptyDescription,
  accountKind,
  emptyIcon,
  balanceHeader,
  extraHeader,
  createAction
}: {
  title: string;
  description?: string;
  openRows: ClientAccountRow[];
  closedRows: ClientAccountRow[];
  openEmptyMessage: string;
  openEmptyDescription?: string;
  closedEmptyMessage: string;
  closedEmptyDescription?: string;
  accountKind?: ClientAccountListKind;
  emptyIcon?: LucideIcon;
  balanceHeader?: string;
  extraHeader?: string;
  createAction?: {
    href: string;
    label: string;
    permission: PermissionInput;
  };
}) {
  const [showClosed, setShowClosed] = useState(false);
  const hasClosed = closedRows.length > 0;
  const rows = showClosed ? closedRows : openRows;
  const showToolbar = createAction !== undefined || hasClosed;
  const emptyMessage = showClosed ? closedEmptyMessage : openEmptyMessage;
  const emptyDescription = showClosed ? closedEmptyDescription : openEmptyDescription;
  const listEmptyIcon = emptyIcon ?? (accountKind ? ACCOUNT_EMPTY_ICONS[accountKind] : undefined);

  const createButton = createAction ? (
    <Can permission={createAction.permission}>
      <Link href={createAction.href} className={cn(buttonVariants({ size: 'sm' }))}>
        <Plus className="size-4" aria-hidden />
        {createAction.label}
      </Link>
    </Can>
  ) : null;

  return (
    <DetailSection
      title={title}
      description={description}
      actions={
        showToolbar ? (
          <div className="flex flex-wrap items-center gap-3">
            {createButton}
            {hasClosed ? (
              <div className="flex items-center gap-2">
                <Switch
                  id={`${title}-show-closed`}
                  checked={showClosed}
                  onCheckedChange={setShowClosed}
                  aria-label="Show closed accounts"
                />
                <Label
                  htmlFor={`${title}-show-closed`}
                  className="cursor-pointer text-sm font-normal text-muted-foreground"
                >
                  Show closed
                </Label>
              </div>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={listEmptyIcon}
          title={emptyMessage}
          description={emptyDescription}
          action={createButton ?? undefined}
        />
      ) : (
        <ClientAccountsTable
          rows={rows}
          balanceHeader={balanceHeader}
          extraHeader={extraHeader}
        />
      )}
    </DetailSection>
  );
}
