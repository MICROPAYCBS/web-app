import { NextResponse } from 'next/server';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import { createFineractClient } from '@/lib/fineract/create-client';

const MIN_PASSWORD_LENGTH = 12;

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

  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const password = String(record.password ?? '').trim();
  const repeatPassword = String(record.repeatPassword ?? '').trim();

  if (!password || !repeatPassword) {
    return NextResponse.json(
      { message: 'Password and confirmation are required.' },
      { status: 400 }
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (password !== repeatPassword) {
    return NextResponse.json({ message: 'Passwords do not match.' }, { status: 400 });
  }

  try {
    const fineract = await createFineractClient();
    await fineract.put(`/users/${session!.userId}`, { password, repeatPassword });
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
