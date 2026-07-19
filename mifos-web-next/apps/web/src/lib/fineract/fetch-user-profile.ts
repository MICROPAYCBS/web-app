import 'server-only';

import type { SessionUser } from '@mifos/auth';
import { createFineractClient } from '@/lib/fineract/create-client';

interface FineractAppUser {
  firstname?: string;
  lastname?: string;
  officeName?: string;
  username?: string;
}

function buildDisplayName(firstname?: string, lastname?: string, username?: string): string {
  const full = [firstname, lastname]
    .filter((part) => part?.trim())
    .join(' ')
    .trim();
  if (full) {
    return full;
  }
  return username?.trim() || '';
}

/** Loads Fineract user profile fields for sidebar / session display. */
export async function enrichSessionUser(user: SessionUser): Promise<SessionUser> {
  try {
    const fineract = await createFineractClient();
    const profile = await fineract.get<FineractAppUser>(`/users/${user.userId}`);
    const displayName = buildDisplayName(profile.firstname, profile.lastname, user.username);
    return {
      ...user,
      firstName: profile.firstname?.trim() || undefined,
      lastName: profile.lastname?.trim() || undefined,
      displayName: displayName || user.username,
      officeName: profile.officeName?.trim() || user.officeName
    };
  } catch {
    return {
      ...user,
      displayName: user.displayName ?? user.username
    };
  }
}
