/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import type { PermissionInput, PermissionRule } from '@mifos/auth';
import { resolvePermission } from '@mifos/auth';
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
  UserPlus,
  X,
  XCircle,
  type LucideIcon
} from 'lucide-react';
import type {
  ClientActionDialogId,
  ClientActionSheetId
} from '@/lib/clients/client-action-types';
import { clientLifecyclePermissionKey } from '@/lib/clients/client-action-permissions';
import { clientStatusKind, isClientUnderTransfer } from '@/lib/fineract/client-status';

export type ClientActionsMenuLink = {
  kind: 'link';
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionInput | PermissionRule;
};

/** Opens the wide edit side panel (`?edit=1` on the current client route). */
export type ClientActionsMenuEditPanel = {
  kind: 'edit-panel';
  id: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionInput | PermissionRule;
};

export type ClientActionsMenuSheet = {
  kind: 'sheet';
  id: string;
  label: string;
  icon: LucideIcon;
  sheetId: ClientActionSheetId;
  permission?: PermissionInput | PermissionRule;
};

export type ClientActionsMenuDialog = {
  kind: 'dialog';
  id: string;
  label: string;
  icon: LucideIcon;
  dialogId: ClientActionDialogId;
  permission?: PermissionInput | PermissionRule;
};

export type ClientActionsMenuCommand = {
  kind: 'command';
  id: string;
  label: string;
  icon: LucideIcon;
  command: 'deleteClient';
  permission?: PermissionInput | PermissionRule;
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
  permission?: PermissionInput | PermissionRule
): ClientActionsMenuSheet {
  return { kind: 'sheet', id, label, icon, sheetId: id, permission };
}

function dialogAction(
  id: ClientActionDialogId,
  label: string,
  icon: LucideIcon,
  permission?: PermissionInput | PermissionRule
): ClientActionsMenuDialog {
  return { kind: 'dialog', id, label, icon, dialogId: id, permission };
}

function separator(id: string): ClientActionsMenuSeparator {
  return { kind: 'separator', id };
}

function lifecycleSheet(
  id: ClientActionSheetId,
  label: string,
  icon: LucideIcon
): ClientActionsMenuSheet {
  const permissionKey = clientLifecyclePermissionKey(id);
  return sheetAction(
    id,
    label,
    icon,
    permissionKey ? resolvePermission(permissionKey) : undefined
  );
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
    lifecycleSheet('close', 'Close', XCircle)
  ];

  if (!underTransfer) {
    lifecycle.push(lifecycleSheet('transfer', 'Transfer customer', ArrowRightLeft));
  }

  if (status === 'pending') {
    lifecycle.push(
      lifecycleSheet('activate', 'Activate', CheckCircle),
      lifecycleSheet('withdraw', 'Withdraw', Undo2),
      lifecycleSheet('reject', 'Reject', Ban),
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
    lifecycle.push(lifecycleSheet('reactivate', 'Reactivate', RotateCcw));
  }

  if (status === 'rejected') {
    lifecycle.push(lifecycleSheet('undo-rejection', 'Undo rejection', RotateCcw));
  }

  if (status === 'transferInProgress') {
    lifecycle.push(
      lifecycleSheet('undo-transfer', 'Undo transfer', Undo2),
      lifecycleSheet('accept-transfer', 'Accept transfer', Check),
      lifecycleSheet('reject-transfer', 'Reject transfer', X)
    );
  }

  if (status === 'transferOnHold') {
    lifecycle.push(lifecycleSheet('undo-transfer', 'Undo transfer', Undo2));
  }

  if (lifecycle.length > 0) {
    items.push(separator('before-lifecycle'));
    items.push(...lifecycle);
  }

  items.push(separator('before-staff'));
  if (!hasStaff) {
    items.push(
      sheetAction('assign-staff', 'Assign relationship officer', UserPlus, 'ASSIGNSTAFF_CLIENT')
    );
  } else {
    items.push(
      sheetAction('reassign-staff', 'Reassign relationship officer', ArrowRightLeft, {
        all: ['ASSIGNSTAFF_CLIENT', 'UNASSIGNSTAFF_CLIENT']
      })
    );
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
  'reassign-staff': 'Reassign relationship officer',
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

export const CLIENT_ACTION_SHEET_OUTCOME_MESSAGES: Record<
  ClientActionSheetId,
  { completed: string; pending: string }
> = {
  activate: {
    completed: 'Customer activated.',
    pending: 'Customer activation sent for approval.'
  },
  close: {
    completed: 'Customer closed.',
    pending: 'Customer closure sent for approval.'
  },
  withdraw: {
    completed: 'Customer withdrawn.',
    pending: 'Customer withdrawal sent for approval.'
  },
  reject: {
    completed: 'Customer rejected.',
    pending: 'Customer rejection sent for approval.'
  },
  reactivate: {
    completed: 'Customer reactivated.',
    pending: 'Customer reactivation sent for approval.'
  },
  'undo-rejection': {
    completed: 'Rejection undone.',
    pending: 'Undo rejection sent for approval.'
  },
  transfer: {
    completed: 'Transfer proposed.',
    pending: 'Transfer proposal sent for approval.'
  },
  'accept-transfer': {
    completed: 'Transfer accepted.',
    pending: 'Transfer acceptance sent for approval.'
  },
  'reject-transfer': {
    completed: 'Transfer rejected.',
    pending: 'Transfer rejection sent for approval.'
  },
  'undo-transfer': {
    completed: 'Transfer undone.',
    pending: 'Transfer undo sent for approval.'
  },
  'assign-staff': {
    completed: 'Relationship officer assigned.',
    pending: 'Relationship officer assignment sent for approval.'
  },
  'reassign-staff': {
    completed: 'Relationship officer reassigned.',
    pending: 'Relationship officer reassignment sent for approval.'
  },
  'update-default-savings': {
    completed: 'Default savings account updated.',
    pending: 'Default savings account update sent for approval.'
  }
};
