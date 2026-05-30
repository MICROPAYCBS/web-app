import 'server-only';

import { can, getRoutePermission } from '@mifos/auth';
import { getServerSession } from '@/lib/session/server';

export async function requireServerSession() {
  const session = await getServerSession();
  if (!session) {
    return { session: null, error: Response.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null as Response | null };
}

export async function requireRoutePermission(pathname: string) {
  const { session, error } = await requireServerSession();
  if (error) {
    return { session: null, error };
  }
  const required = getRoutePermission(pathname);
  if (required && session && !can(session, required)) {
    return { session, error: Response.json({ message: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null as Response | null };
}
