import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import { fetchActivePasswordPolicyRules } from '@/lib/fineract/password-policy';

/**
 * BFF: active Fineract password validation rules for the signed-in user.
 */
export async function GET() {
  const { error } = await requireServerSession();
  if (error) {
    return error;
  }

  try {
    const rules = await fetchActivePasswordPolicyRules();
    return jsonOk(rules);
  } catch (err) {
    return jsonError(err);
  }
}
