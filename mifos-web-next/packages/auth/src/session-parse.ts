import type { SessionUser } from './types';

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
    return data;
  } catch {
    return null;
  }
}
