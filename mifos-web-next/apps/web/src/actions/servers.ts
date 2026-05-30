'use server';

import { revalidatePath } from 'next/cache';
import type { UpsertServerInput } from '@mifos/servers';
import {
  addFineractServer,
  deleteFineractServer,
  selectFineractServer,
  updateFineractServer
} from '@/lib/servers/catalog-store';

export type ServerActionResult = { ok: true } | { ok: false; message: string };

function revalidateServerPaths() {
  revalidatePath('/login');
  revalidatePath('/settings/servers');
}

export async function selectServerAction(serverId: string): Promise<ServerActionResult> {
  try {
    await selectFineractServer(serverId);
    revalidateServerPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Failed to select server' };
  }
}

export async function addServerAction(input: UpsertServerInput): Promise<ServerActionResult> {
  try {
    if (!input.name?.trim() || !input.baseUrl?.trim()) {
      return { ok: false, message: 'Name and API URL are required' };
    }
    await addFineractServer(input);
    revalidateServerPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Failed to add server' };
  }
}

export async function updateServerAction(
  serverId: string,
  input: UpsertServerInput
): Promise<ServerActionResult> {
  try {
    await updateFineractServer(serverId, input);
    revalidateServerPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Failed to update server' };
  }
}

export async function deleteServerAction(serverId: string): Promise<ServerActionResult> {
  try {
    await deleteFineractServer(serverId);
    revalidateServerPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Failed to delete server' };
  }
}
