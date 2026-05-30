import { assertCan, resolvePermission } from '@mifos/auth';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { createFineractClient } from '@/lib/fineract/create-client';

/**
 * BFF: list clients — browser calls /api/clients, server calls Fineract.
 */
export async function GET() {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('clients.list'));
    const fineract = await createFineractClient();
    const data = await fineract.get<unknown>('/clients', { limit: '25' });
    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}
