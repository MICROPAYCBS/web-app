import { NextResponse } from 'next/server';
import { validateChangeOwnPassword } from '@mifos/validation';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import {
  authenticateFineract,
  AuthenticationError
} from '@/lib/fineract/authenticate';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  fetchActivePasswordPolicyRules,
  validatePasswordAgainstPolicy
} from '@/lib/fineract/password-policy';

/**
 * BFF: change the signed-in user's Fineract password (PUT /users/{id}).
 */
export async function POST(request: Request) {
  const { session, error } = await requireServerSession();
  if (error) {
    return error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const parsed = validateChangeOwnPassword(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? 'Fix the highlighted fields.' },
      { status: 400 }
    );
  }

  const { currentPassword, password, repeatPassword } = parsed.data;

  try {
    const policy = await fetchActivePasswordPolicyRules();
    const policyError = validatePasswordAgainstPolicy(password, policy);
    if (policyError) {
      return NextResponse.json({ message: policyError }, { status: 400 });
    }

    try {
      await authenticateFineract({
        username: session!.username,
        password: currentPassword
      });
    } catch (authError) {
      if (authError instanceof AuthenticationError && authError.code === 'INVALID_CREDENTIALS') {
        return NextResponse.json(
          { message: 'Current password is incorrect.' },
          { status: 400 }
        );
      }
      throw authError;
    }

    const fineract = await createFineractClient();
    await fineract.put(`/users/${session!.userId}`, { password, repeatPassword });
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
