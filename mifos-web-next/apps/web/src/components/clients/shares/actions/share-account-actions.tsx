'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractShareAccountDetail } from '@mifos/api-client';
import {
  Check,
  MoreHorizontal,
  Pencil,
  Power,
  Undo2,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  DoorClosed,
  type LucideIcon
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { ShareAccountAdditionalDecisionSheet } from '@/components/clients/shares/actions/share-account-additional-decision-sheet';
import { ShareAccountCloseSheet } from '@/components/clients/shares/actions/share-account-close-sheet';
import {
  ShareAccountLifecycleDialog,
  type ShareAccountLifecycleDialogKind
} from '@/components/clients/shares/actions/share-account-lifecycle-dialog';
import { ShareAccountModifySheet } from '@/components/clients/shares/actions/share-account-modify-sheet';
import { ShareAccountSharesRequestSheet } from '@/components/clients/shares/actions/share-account-shares-request-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { shareAccountActionVisibility } from '@/lib/fineract/share-account-display';

export interface ShareAccountActionPermissions {
  approve: boolean;
  activate: boolean;
  reject: boolean;
  undoApproval: boolean;
  modify: boolean;
  close: boolean;
  applyAdditional: boolean;
  approveAdditional: boolean;
  rejectAdditional: boolean;
  redeem: boolean;
}

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  visible: boolean;
  onSelect: () => void;
  destructive?: boolean;
};

export function ShareAccountActions({
  account,
  clientId,
  permissions
}: {
  account: FineractShareAccountDetail;
  clientId: string;
  permissions: ShareAccountActionPermissions;
}) {
  const visibility = shareAccountActionVisibility(account);
  const [lifecycleKind, setLifecycleKind] = useState<ShareAccountLifecycleDialogKind | null>(null);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [approveAdditionalOpen, setApproveAdditionalOpen] = useState(false);
  const [rejectAdditionalOpen, setRejectAdditionalOpen] = useState(false);

  function openLifecycle(kind: ShareAccountLifecycleDialogKind) {
    setLifecycleKind(kind);
    setLifecycleOpen(true);
  }

  const primary: MenuItem[] = [
    {
      id: 'approve',
      label: 'Approve',
      icon: Check,
      visible: visibility.approve && permissions.approve,
      onSelect: () => openLifecycle('approve')
    },
    {
      id: 'activate',
      label: 'Activate',
      icon: Power,
      visible: visibility.activate && permissions.activate,
      onSelect: () => openLifecycle('activate')
    },
    {
      id: 'apply',
      label: 'Apply additional shares',
      icon: ArrowUpFromLine,
      visible: visibility.applyAdditional && permissions.applyAdditional,
      onSelect: () => setApplyOpen(true)
    }
  ].filter((item) => item.visible);

  const overflow: MenuItem[] = [
    {
      id: 'modify',
      label: 'Modify application',
      icon: Pencil,
      visible: visibility.modify && permissions.modify,
      onSelect: () => setModifyOpen(true)
    },
    {
      id: 'reject',
      label: 'Reject',
      icon: XCircle,
      visible: visibility.reject && permissions.reject,
      onSelect: () => openLifecycle('reject'),
      destructive: true
    },
    {
      id: 'undo',
      label: 'Undo approval',
      icon: Undo2,
      visible: visibility.undoApproval && permissions.undoApproval,
      onSelect: () => openLifecycle('undoApproval')
    },
    {
      id: 'approveAdditional',
      label: 'Approve additional shares',
      icon: Check,
      visible: visibility.approveAdditional && permissions.approveAdditional,
      onSelect: () => setApproveAdditionalOpen(true)
    },
    {
      id: 'rejectAdditional',
      label: 'Reject additional shares',
      icon: XCircle,
      visible: visibility.rejectAdditional && permissions.rejectAdditional,
      onSelect: () => setRejectAdditionalOpen(true),
      destructive: true
    },
    {
      id: 'redeem',
      label: 'Redeem shares',
      icon: ArrowDownToLine,
      visible: visibility.redeem && permissions.redeem,
      onSelect: () => setRedeemOpen(true)
    },
    {
      id: 'close',
      label: 'Close',
      icon: DoorClosed,
      visible: visibility.close && permissions.close,
      onSelect: () => setCloseOpen(true),
      destructive: true
    }
  ].filter((item) => item.visible);

  if (!primary.length && !overflow.length) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {primary.map((item) => (
          <Button key={item.id} type="button" size="sm" onClick={item.onSelect}>
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Button>
        ))}
        {overflow.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" size="sm" variant="outline" aria-label="More actions" />
              }
            >
              <MoreHorizontal className="size-4" />
              More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {overflow.map((item, index) => (
                <Fragment key={item.id}>
                  {index > 0 && item.destructive ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    variant={item.destructive ? 'destructive' : 'default'}
                    onClick={item.onSelect}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <ShareAccountLifecycleDialog
        open={lifecycleOpen}
        onOpenChange={setLifecycleOpen}
        kind={lifecycleKind}
        clientId={clientId}
        accountId={account.id}
      />
      <ShareAccountCloseSheet
        open={closeOpen}
        onOpenChange={setCloseOpen}
        clientId={clientId}
        accountId={account.id}
      />
      <ShareAccountModifySheet
        open={modifyOpen}
        onOpenChange={setModifyOpen}
        clientId={clientId}
        account={account}
      />
      <ShareAccountSharesRequestSheet
        open={applyOpen}
        onOpenChange={setApplyOpen}
        clientId={clientId}
        account={account}
        kind="applyAdditional"
      />
      <ShareAccountSharesRequestSheet
        open={redeemOpen}
        onOpenChange={setRedeemOpen}
        clientId={clientId}
        account={account}
        kind="redeem"
      />
      <ShareAccountAdditionalDecisionSheet
        open={approveAdditionalOpen}
        onOpenChange={setApproveAdditionalOpen}
        clientId={clientId}
        account={account}
        kind="approveAdditional"
      />
      <ShareAccountAdditionalDecisionSheet
        open={rejectAdditionalOpen}
        onOpenChange={setRejectAdditionalOpen}
        clientId={clientId}
        account={account}
        kind="rejectAdditional"
      />
    </>
  );
}
