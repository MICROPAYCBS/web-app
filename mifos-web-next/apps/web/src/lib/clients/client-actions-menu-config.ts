/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import type { PermissionInput } from '@mifos/auth';
import {
  ArrowRightLeft,
  Ban,
  Check,
  CheckCircle,
  Eraser,
  Pencil,
  PenLine,
  PenTool,
  PiggyBank,
  RotateCcw,
  Trash2,
  Undo2,
  UserMinus,
  UserPlus,
  X,
  XCircle,
  type LucideIcon
} from 'lucide-react';
import type {
  ClientActionDialogId,
  ClientActionSheetId
} from '@/lib/clients/client-action-types';
import { clientStatusKind, isClientUnderTransfer } from '@/lib/fineract/client-status';

export type ClientActionsMenuLink = {
  kind: 'link';
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionInput;
};

/** Opens the wide edit side panel (`?edit=1` on the current client route). */
export type ClientActionsMenuEditPanel = {
  kind: 'edit-panel';
  id: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionInput;
};

export type ClientActionsMenuSheet = {
  kind: 'sheet';
  id: string;
  label: string;
  icon: LucideIcon;
  sheetId: ClientActionSheetId;
  permission?: PermissionInput;
};

export type ClientActionsMenuDialog = {
  kind: 'dialog';
  id: string;
  label: string;
  icon: LucideIcon;
  dialogId: ClientActionDialogId;
  permission?: PermissionInput;
};

export type ClientActionsMenuCommand = {
  kind: 'command';
  id: string;
  label: string;
  icon: LucideIcon;
  command: 'unassignStaff' | 'deleteClient';
  permission?: PermissionInput;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  destructive?: boolean;
};

export type ClientActionsMenuSeparator = {
  kind: 'separator';
  id: string;
};

export type ClientActionsMenuEntry =
  | ClientActionsMenuLink
  | ClientActionsMenuEditPanel
  | ClientActionsMenuSheet
  | ClientActionsMenuDialog
  | ClientActionsMenuCommand
  | ClientActionsMenuSeparator;

function sheetAction(
  id: ClientActionSheetId,
  label: string,
  icon: LucideIcon,
  permission?: PermissionInput
): ClientActionsMenuSheet {
  return { kind: 'sheet', id, label, icon, sheetId: id, permission };
}

function dialogAction(
  id: ClientActionDialogId,
  label: string,
  icon: LucideIcon,
  permission?: PermissionInput
): ClientActionsMenuDialog {
  return { kind: 'dialog', id, label, icon, dialogId: id, permission };
}

function separator(id: string): ClientActionsMenuSeparator {
  return { kind: 'separator', id };
}

export function buildClientActionsMenuItems(
  client: Pick<FineractClientDetail, 'id' | 'status' | 'staffId'>,
  options?: { hasSignature?: boolean }
): ClientActionsMenuEntry[] {
  const hasSignature = options?.hasSignature === true;
  const clientId = String(client.id);
  const status = clientStatusKind(client);
  const hasStaff = typeof client.staffId === 'number' && client.staffId > 0;
  const items: ClientActionsMenuEntry[] = [];

  items.push({
    kind: 'edit-panel',
    id: 'edit',
    label: 'Edit',
    icon: Pencil,
    permission: 'UPDATE_CLIENT'
  });

  const underTransfer = isClientUnderTransfer(status);

  const lifecycle: (ClientActionsMenuSheet | ClientActionsMenuCommand)[] = [
    sheetAction('close', 'Close', XCircle)
  ];

  if (!underTransfer) {
    lifecycle.push(sheetAction('transfer', 'Transfer customer', ArrowRightLeft));
  }

  if (status === 'pending') {
    lifecycle.push(
      sheetAction('activate', 'Activate', CheckCircle),
      sheetAction('withdraw', 'Withdraw', Undo2),
      sheetAction('reject', 'Reject', Ban),
      {
        kind: 'command',
        id: 'delete',
        label: 'Delete',
        icon: Trash2,
        command: 'deleteClient',
        permission: 'DELETE_CLIENT',
        confirmTitle: 'Delete customer?',
        confirmDescription:
          'This permanently removes the customer. This cannot be undone.',
        confirmLabel: 'Delete',
        destructive: true
      }
    );
  }

  if (status === 'closed') {
    lifecycle.push(sheetAction('reactivate', 'Reactivate', RotateCcw));
  }

  if (status === 'rejected') {
    lifecycle.push(sheetAction('undo-rejection', 'Undo rejection', RotateCcw));
  }

  if (status === 'transferInProgress') {
    lifecycle.push(
      sheetAction('undo-transfer', 'Undo transfer', Undo2),
      sheetAction('accept-transfer', 'Accept transfer', Check),
      sheetAction('reject-transfer', 'Reject transfer', X)
    );
  }

  if (status === 'transferOnHold') {
    lifecycle.push(sheetAction('undo-transfer', 'Undo transfer', Undo2));
  }

  if (lifecycle.length > 0) {
    items.push(separator('before-lifecycle'));
    items.push(...lifecycle);
  }

  items.push(separator('before-staff'));
  if (!hasStaff) {
    items.push(sheetAction('assign-staff', 'Assign relationship officer', UserPlus));
  } else {
    items.push({
      kind: 'command',
      id: 'unassign-staff',
      label: 'Unassign relationship officer',
      icon: UserMinus,
      command: 'unassignStaff',
      permission: 'UNASSIGNSTAFF_CLIENT',
      confirmTitle: 'Unassign relationship officer?',
      confirmDescription:
        'The customer will no longer be assigned to their current relationship officer.',
      confirmLabel: 'Unassign',
      destructive: false
    });
  }

  items.push(
    separator('before-other'),
    sheetAction(
      'update-default-savings',
      'Update default savings',
      PiggyBank,
      'UPDATESAVINGSACCOUNT_CLIENT'
    ),
    dialogAction('upload-signature', 'Upload signature', PenLine, 'CREATE_CLIENTIMAGE'),
    dialogAction('draw-signature', 'Draw signature', PenTool, 'CREATE_CLIENTIMAGE')
  );

  if (hasSignature) {
    items.push(
      dialogAction('delete-signature', 'Delete signature', Eraser, 'DELETE_CLIENTIMAGE')
    );
  }

  return items;
}

export const CLIENT_ACTION_SHEET_TITLES: Record<ClientActionSheetId, string> = {
  'assign-staff': 'Assign relationship officer',
  close: 'Close customer',
  transfer: 'Transfer customer',
  activate: 'Activate customer',
  withdraw: 'Withdraw customer',
  reject: 'Reject customer',
  reactivate: 'Reactivate customer',
  'undo-rejection': 'Undo rejection',
  'undo-transfer': 'Undo transfer',
  'accept-transfer': 'Accept transfer',
  'reject-transfer': 'Reject transfer',
  'update-default-savings': 'Update default savings'
};
