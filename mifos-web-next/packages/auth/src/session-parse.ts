import type { SessionRole, SessionUser } from './types';

/** Normalize Fineract authentication `roles` into session role refs. */
export function parseSessionRoles(roles: unknown): SessionRole[] {
  if (!Array.isArray(roles)) {
    return [];
  }

  const parsed: SessionRole[] = [];
  for (const entry of roles) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const id = typeof row.id === 'number' ? row.id : Number(row.id);
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!Number.isFinite(id) || !name) {
      continue;
    }
    parsed.push({ id, name });
  }
  return parsed;
}

/** Parse session JSON from cookie/storage. Returns null if invalid. */
export function parseSessionJson(raw: string | null | undefined): SessionUser | null {
  if (!raw) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as SessionUser;
    if (!data || typeof data.userId !== 'number' || !Array.isArray(data.permissions)) {
      return null;
    }
    return {
      ...data,
      roles: parseSessionRoles(data.roles)
    };
  } catch {
    return null;
  }
}
