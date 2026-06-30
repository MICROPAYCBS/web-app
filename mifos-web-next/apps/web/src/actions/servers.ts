'use server';

import { actionSuccessFromFineractCommand } from '@mifos/validation';

import { revalidatePath } from 'next/cache';
import type { UpsertServerInput } from '@mifos/servers';
import {
  addFineractServer,
  deleteFineractServer,
  getServerCatalog,
  selectFineractServer,
  updateFineractServer
} from '@/lib/servers/catalog-store';
import { clearSessionCookie } from '@/lib/session/cookie';
import { getServerSession } from '@/lib/session/server';

export type ServerActionResult =
  | { ok: true; signedOut?: boolean }
  | { ok: false; message: string };

function revalidateServerPaths() {
  revalidatePath('/login');
  revalidatePath('/settings/servers');
}

export async function selectServerAction(serverId: string): Promise<ServerActionResult> {
  try {
    const catalog = await getServerCatalog();
    const switchingServer = catalog.activeServerId !== serverId;
    let signedOut = false;

    if (switchingServer) {
      const session = await getServerSession();
      if (session) {
        await clearSessionCookie();
        signedOut = true;
      }
    }

    await selectFineractServer(serverId);
    revalidateServerPaths();
    if (signedOut) {
      revalidatePath('/', 'layout');
    }
    return { ok: true, signedOut };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Failed to select server' };
  }
}

function missingRequiredServerFields(input: UpsertServerInput): boolean {
  return !input.name?.trim() || !input.baseUrl?.trim() || !input.tenantId?.trim();
}

export async function addServerAction(input: UpsertServerInput): Promise<ServerActionResult> {
  try {
    if (missingRequiredServerFields(input)) {
      return { ok: false, message: 'Name, server URL, and tenant are required' };
    }
    const response = await addFineractServer(input);
    revalidateServerPaths();
    return actionSuccessFromFineractCommand(response, {});
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Failed to add server' };
  }
}

export async function updateServerAction(
  serverId: string,
  input: UpsertServerInput
): Promise<ServerActionResult> {
  try {
    if (missingRequiredServerFields(input)) {
      return { ok: false, message: 'Name, server URL, and tenant are required' };
    }
    const response = await updateFineractServer(serverId, input);
    revalidateServerPaths();
    return actionSuccessFromFineractCommand(response, {});
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Failed to update server' };
  }
}

export async function deleteServerAction(serverId: string): Promise<ServerActionResult> {
  try {
    const response = await deleteFineractServer(serverId);
    revalidateServerPaths();
    return actionSuccessFromFineractCommand(response, {});
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Failed to delete server' };
  }
}
