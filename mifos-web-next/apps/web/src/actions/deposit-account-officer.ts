'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import type { ClientDepositAccountKind } from '@mifos/api-client';
import {
  savingsAccountAssignStaffSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  DEPOSIT_FIELD_OFFICER_CONFIG,
  type DepositFieldOfficerKind
} from '@/lib/fineract/account-field-officer-config';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { CLIENT_DEPOSIT_ACCOUNT_CONFIG } from '@/lib/fineract/client-deposit-account-config';
import {
  executeDepositAccountFieldOfficerCommand,
  getDepositAccount
} from '@/lib/fineract/deposit-account-officer-commands';
import { getClientWithTemplate } from '@/lib/fineract/client-action-data';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import { getServerSession } from '@/lib/session/server';

export type DepositAccountOfficerActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

type ParsedResult<T> =
  | { success: true; data: T }
  | { success: false; result: DepositAccountOfficerActionResult };

function parseOrError<T>(schema: z.ZodType<T>, raw: unknown): ParsedResult<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      result: {
        ok: false,
        message: 'Fix the highlighted fields.',
        fieldErrors: fieldErrorsFromZod(parsed.error.issues)
      }
    };
  }
  return { success: true, data: parsed.data };
}

async function requireAllPermissions(
  kind: DepositFieldOfficerKind,
  deniedMessage: string
): Promise<{ ok: false; message: string } | null> {
  const config = DEPOSIT_FIELD_OFFICER_CONFIG[kind];
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, { all: [config.assignPermission, config.removePermission] });
  } catch {
    return { ok: false, message: deniedMessage };
  }
  return null;
}

async function requireAssignPermission(
  kind: DepositFieldOfficerKind,
  deniedMessage: string
): Promise<{ ok: false; message: string } | null> {
  const config = DEPOSIT_FIELD_OFFICER_CONFIG[kind];
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, config.assignPermission);
  } catch {
    return { ok: false, message: deniedMessage };
  }
  return null;
}

function revalidateDepositAccountPaths(
  clientId: string,
  kind: ClientDepositAccountKind,
  accountId: string | number
) {
  revalidatePath(clientAccountGeneralPath(clientId, CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].listKind, accountId));
  revalidatePath(`/clients/${clientId}/${CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].listKind === 'savings' ? 'savings' : CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].listKind === 'fixedDeposit' ? 'fixed-deposits' : 'recurring-deposits'}`);
}

async function loadStaffOptions(clientId: string, excludeOfficerId?: number) {
  const client = await getClientWithTemplate(clientId);
  return client.staffOptions
    .filter((row) => excludeOfficerId == null || row.id !== excludeOfficerId)
    .map((row) => ({
      id: row.id,
      name: row.displayName ?? row.firstname ?? `Staff #${row.id}`
    }));
}

export async function loadDepositAccountAssignOfficerSheetDataAction(
  clientId: string,
  kind: DepositFieldOfficerKind
): Promise<
  | { ok: true; staffOptions: { id: number; name: string }[] }
  | { ok: false; message: string }
> {
  const config = DEPOSIT_FIELD_OFFICER_CONFIG[kind];
  const denied = await requireAssignPermission(
    kind,
    `You do not have permission to assign ${config.officerLabel.toLowerCase()}s.`
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const staffOptions = await loadStaffOptions(clientId);
    return { ok: true, staffOptions };
  } catch (error) {
    return toFineractActionError(error, `Could not load ${config.officerLabel.toLowerCase()}s.`);
  }
}

export async function loadDepositAccountReassignOfficerSheetDataAction(
  clientId: string,
  kind: DepositFieldOfficerKind,
  accountId: string
): Promise<
  | {
      ok: true;
      currentOfficerName: string;
      staffOptions: { id: number; name: string }[];
    }
  | { ok: false; message: string }
> {
  const config = DEPOSIT_FIELD_OFFICER_CONFIG[kind];
  const denied = await requireAllPermissions(
    kind,
    `You need permission to assign and remove ${config.officerLabel.toLowerCase()}s to reassign.`
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const account = await getDepositAccount(kind, accountId);
    if (!account) {
      return { ok: false, message: 'Account not found.' };
    }
    const currentOfficerId = account.fieldOfficerId;
    if (!currentOfficerId) {
      return { ok: false, message: `No ${config.officerLabel.toLowerCase()} is assigned.` };
    }
    const currentOfficerName =
      account.fieldOfficerName?.trim() || `${config.officerLabel} ${currentOfficerId}`;
    const staffOptions = await loadStaffOptions(clientId, currentOfficerId);
    return { ok: true, currentOfficerName, staffOptions };
  } catch (error) {
    return toFineractActionError(error, `Could not load ${config.officerLabel.toLowerCase()}s.`);
  }
}

export async function executeDepositAccountAssignOfficerAction(
  clientId: string,
  kind: DepositFieldOfficerKind,
  accountId: string,
  raw: unknown
): Promise<DepositAccountOfficerActionResult> {
  const config = DEPOSIT_FIELD_OFFICER_CONFIG[kind];
  const denied = await requireAssignPermission(
    kind,
    `You do not have permission to assign ${config.officerLabel.toLowerCase()}s.`
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(savingsAccountAssignStaffSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await executeDepositAccountFieldOfficerCommand(
      kind,
      accountId,
      'assignSavingsOfficer',
      buildFineractCommandBody({
        toSavingsOfficerId: parsed.data.toSavingsOfficerId,
        assignmentDate: parsed.data.assignmentDate
      })
    );
    revalidateDepositAccountPaths(clientId, kind, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, `Could not assign ${config.officerLabel.toLowerCase()}.`);
  }
}

export async function executeDepositAccountReassignOfficerAction(
  clientId: string,
  kind: DepositFieldOfficerKind,
  accountId: string,
  raw: unknown
): Promise<DepositAccountOfficerActionResult> {
  const config = DEPOSIT_FIELD_OFFICER_CONFIG[kind];
  const denied = await requireAllPermissions(
    kind,
    `You need permission to assign and remove ${config.officerLabel.toLowerCase()}s to reassign.`
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(savingsAccountAssignStaffSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const account = await getDepositAccount(kind, accountId);
    if (!account) {
      return { ok: false, message: 'Account not found.' };
    }
    const currentOfficerId = account.fieldOfficerId;
    if (!currentOfficerId) {
      return { ok: false, message: `No ${config.officerLabel.toLowerCase()} is assigned.` };
    }
    if (parsed.data.toSavingsOfficerId === currentOfficerId) {
      return {
        ok: false,
        message: 'Fix the highlighted fields.',
        fieldErrors: {
          toSavingsOfficerId: `Select a different ${config.officerLabel.toLowerCase()}.`
        }
      };
    }

    const reassignmentDate = parsed.data.assignmentDate;
    const response = await executeDepositAccountFieldOfficerCommand(
      kind,
      accountId,
      'unassignSavingsOfficer',
      buildFineractCommandBody({ unassignedDate: reassignmentDate })
    );
    await executeDepositAccountFieldOfficerCommand(
      kind,
      accountId,
      'assignSavingsOfficer',
      buildFineractCommandBody({
        toSavingsOfficerId: parsed.data.toSavingsOfficerId,
        assignmentDate: reassignmentDate
      })
    );
    revalidateDepositAccountPaths(clientId, kind, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, `Could not reassign ${config.officerLabel.toLowerCase()}.`);
  }
}
