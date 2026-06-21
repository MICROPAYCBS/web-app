'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { formatActionErrorMessage } from '@mifos/validation';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  deleteClientAction,
  unassignClientStaffAction
} from '@/actions/client-command';
import { ClientActionSheet } from '@/components/clients/detail/client-action-sheet';
import {
  ClientSignatureDeleteDialog,
  ClientSignatureUploadDialog
} from '@/components/clients/detail/client-signature-dialogs';
import { ClientSignatureDrawDialog } from '@/components/clients/detail/client-signature-draw-dialog';
import {
  buildClientActionsMenuItems,
  type ClientActionsMenuCommand,
  type ClientActionsMenuDialog,
  type ClientActionsMenuEditPanel,
  type ClientActionsMenuEntry,
  type ClientActionsMenuLink,
  type ClientActionsMenuSheet
} from '@/lib/clients/client-actions-menu-config';
import type {
  ClientActionDialogId,
  ClientActionSheetId
} from '@/lib/clients/client-action-types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

function MenuEditPanelItem({
  item,
  onOpen
}: {
  item: ClientActionsMenuEditPanel;
  onOpen: () => void;
}) {
  const Icon = item.icon;
  const entry = (
    <DropdownMenuItem onClick={onOpen}>
      <Icon className="size-4" aria-hidden />
      {item.label}
    </DropdownMenuItem>
  );
  if (!item.permission) {
    return entry;
  }
  return <Can permission={item.permission}>{entry}</Can>;
}

function MenuLinkItem({ item }: { item: ClientActionsMenuLink }) {
  const Icon = item.icon;
  const link = (
    <DropdownMenuItem render={<Link href={item.href} />}>
      <Icon className="size-4" aria-hidden />
      {item.label}
    </DropdownMenuItem>
  );
  if (!item.permission) {
    return link;
  }
  return <Can permission={item.permission}>{link}</Can>;
}

function MenuSheetItem({
  item,
  onSelect
}: {
  item: ClientActionsMenuSheet;
  onSelect: (sheetId: ClientActionSheetId) => void;
}) {
  const Icon = item.icon;
  const entry = (
    <DropdownMenuItem onClick={() => onSelect(item.sheetId)}>
      <Icon className="size-4" aria-hidden />
      {item.label}
    </DropdownMenuItem>
  );
  if (!item.permission) {
    return entry;
  }
  return <Can permission={item.permission}>{entry}</Can>;
}

function MenuDialogItem({
  item,
  onSelect
}: {
  item: ClientActionsMenuDialog;
  onSelect: (dialogId: ClientActionDialogId) => void;
}) {
  const Icon = item.icon;
  const entry = (
    <DropdownMenuItem onClick={() => onSelect(item.dialogId)}>
      <Icon className="size-4" aria-hidden />
      {item.label}
    </DropdownMenuItem>
  );
  if (!item.permission) {
    return entry;
  }
  return <Can permission={item.permission}>{entry}</Can>;
}

function MenuCommandItem({
  item,
  onSelect
}: {
  item: ClientActionsMenuCommand;
  onSelect: (item: ClientActionsMenuCommand) => void;
}) {
  const Icon = item.icon;
  const entry = (
    <DropdownMenuItem
      variant={item.destructive ? 'destructive' : 'default'}
      onClick={() => onSelect(item)}
    >
      <Icon className="size-4" aria-hidden />
      {item.label}
    </DropdownMenuItem>
  );
  if (!item.permission) {
    return entry;
  }
  return <Can permission={item.permission}>{entry}</Can>;
}

function MenuEntry({
  entry,
  onEditOpen,
  onSheetSelect,
  onDialogSelect,
  onCommandSelect
}: {
  entry: ClientActionsMenuEntry;
  onEditOpen: () => void;
  onSheetSelect: (sheetId: ClientActionSheetId) => void;
  onDialogSelect: (dialogId: ClientActionDialogId) => void;
  onCommandSelect: (item: ClientActionsMenuCommand) => void;
}) {
  if (entry.kind === 'separator') {
    return <DropdownMenuSeparator />;
  }
  if (entry.kind === 'edit-panel') {
    return <MenuEditPanelItem item={entry} onOpen={onEditOpen} />;
  }
  if (entry.kind === 'link') {
    return <MenuLinkItem item={entry} />;
  }
  if (entry.kind === 'sheet') {
    return <MenuSheetItem item={entry} onSelect={onSheetSelect} />;
  }
  if (entry.kind === 'dialog') {
    return <MenuDialogItem item={entry} onSelect={onDialogSelect} />;
  }
  return <MenuCommandItem item={entry} onSelect={onCommandSelect} />;
}

export function ClientDetailActionsMenu({
  client,
  hasSignature = false,
  signatureDocumentId,
  hasProfileImage = false
}: {
  client: Pick<FineractClientDetail, 'id' | 'status' | 'staffId'>;
  hasSignature?: boolean;
  signatureDocumentId?: number;
  hasProfileImage?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [activeSheet, setActiveSheet] = useState<ClientActionSheetId | null>(null);
  const [activeDialog, setActiveDialog] = useState<ClientActionDialogId | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ClientActionsMenuCommand | null>(
    null
  );
  const menuItems = buildClientActionsMenuItems(client, { hasSignature });
  const clientId = String(client.id);

  function refreshClient() {
    router.refresh();
  }

  function openEditPanel() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('edit', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function runCommand(item: ClientActionsMenuCommand) {
    startTransition(async () => {
      if (item.command === 'unassignStaff') {
        const staffId = client.staffId;
        if (typeof staffId !== 'number') {
          toast.error('No relationship officer is assigned.');
          return;
        }
        const result = await unassignClientStaffAction(clientId, staffId);
        if (!result.ok) {
          toast.error(formatActionErrorMessage(result.message, result.fieldErrors));
          return;
        }
        toast.success('Relationship officer unassigned.');
        refreshClient();
        return;
      }

      if (item.command === 'deleteClient') {
        const result = await deleteClientAction(clientId);
        if (!result.ok) {
          toast.error(formatActionErrorMessage(result.message, result.fieldErrors));
          return;
        }
        toast.success('Customer deleted.');
        router.push('/clients');
      }
    });
  }

  function handleConfirm() {
    if (!confirmTarget) {
      return;
    }
    const target = confirmTarget;
    setConfirmTarget(null);
    runCommand(target);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" disabled={pending} aria-label="Customer actions">
              <Menu className="size-4" aria-hidden />
              Actions
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          {menuItems.map((entry) => (
            <MenuEntry
              key={entry.id}
              entry={entry}
              onEditOpen={openEditPanel}
              onSheetSelect={setActiveSheet}
              onDialogSelect={setActiveDialog}
              onCommandSelect={setConfirmTarget}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ClientActionSheet
        clientId={clientId}
        sheetId={activeSheet}
        open={activeSheet !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSheet(null);
          }
        }}
        onSuccess={() => {
          toast.success('Customer updated.');
          refreshClient();
        }}
        hasProfileImage={hasProfileImage}
      />

      <ClientSignatureUploadDialog
        clientId={clientId}
        open={activeDialog === 'upload-signature'}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDialog(null);
          }
        }}
        onSuccess={() => {
          toast.success('Signature uploaded.');
          refreshClient();
        }}
      />

      <ClientSignatureDrawDialog
        clientId={clientId}
        open={activeDialog === 'draw-signature'}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDialog(null);
          }
        }}
        onSuccess={() => {
          toast.success('Signature saved.');
          refreshClient();
        }}
      />

      {signatureDocumentId !== undefined ? (
        <ClientSignatureDeleteDialog
          clientId={clientId}
          documentId={signatureDocumentId}
          open={activeDialog === 'delete-signature'}
          onOpenChange={(open) => {
            if (!open) {
              setActiveDialog(null);
            }
          }}
          onSuccess={() => {
            toast.success('Signature deleted.');
            refreshClient();
          }}
        />
      ) : null}

      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null);
          }
        }}
      >
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>{confirmTarget?.confirmTitle}</DialogTitle>
            <DialogDescription>{confirmTarget?.confirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmTarget?.destructive ? 'destructive' : 'default'}
              disabled={pending}
              onClick={handleConfirm}
            >
              {confirmTarget?.confirmLabel ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
