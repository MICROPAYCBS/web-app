'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { VerificationCodeField } from '@/components/composites/verification-code-field';
import { Button } from '@/components/ui/button';

type EnrollData = {
  secret: string;
  otpauthUri: string;
  qrDataUrl?: string;
};

type EnrollApiBody =
  | { ok: true; secret: string; otpauthUri: string }
  | { ok: false; message: string }
  | { secret: string; otpauthUri: string };

function parseEnrollPayload(body: EnrollApiBody | null): { secret: string; otpauthUri: string } | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  if ('ok' in body && body.ok === true && body.secret && body.otpauthUri) {
    return { secret: body.secret, otpauthUri: body.otpauthUri };
  }
  if ('secret' in body && 'otpauthUri' in body && body.secret && body.otpauthUri && !('ok' in body)) {
    return { secret: body.secret, otpauthUri: body.otpauthUri };
  }
  return null;
}

function enrollmentErrorMessage(
  response: Response,
  body: EnrollApiBody | null
): string {
  if (body && 'message' in body && body.message?.trim()) {
    return body.message.trim();
  }
  if (response.status === 401) {
    return 'Your sign-in session expired. Sign in again.';
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (response.ok && !contentType.includes('application/json')) {
    return 'Unexpected response while starting enrollment. Sign in again and retry.';
  }
  return `Could not start authenticator enrollment (HTTP ${response.status}).`;
}

export function TotpEnrollmentStep({
  onEnrolled,
  onBack
}: {
  onEnrolled: () => void;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const enrollRequestStarted = useRef(false);
  const confirmInFlight = useRef(false);

  const TOTP_CODE_LENGTH = 6;

  const buildQrDataUrl = useCallback(async (otpauthUri: string) => {
    try {
      const QRCode = await import('qrcode');
      return await QRCode.toDataURL(otpauthUri, {
        margin: 2,
        width: 200
      });
    } catch {
      return undefined;
    }
  }, []);

  const loadEnrollment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/twofactor/totp/enroll', {
        method: 'POST',
        credentials: 'same-origin'
      });
      const body = (await response.json().catch(() => null)) as EnrollApiBody | null;
      const payload = parseEnrollPayload(body);
      if (!payload) {
        setError(enrollmentErrorMessage(response, body));
        setEnrollData(null);
        return;
      }
      const qrDataUrl = await buildQrDataUrl(payload.otpauthUri);
      setEnrollData({
        secret: payload.secret,
        otpauthUri: payload.otpauthUri,
        qrDataUrl
      });
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setEnrollData(null);
    } finally {
      setLoading(false);
    }
  }, [buildQrDataUrl]);

  useEffect(() => {
    if (enrollRequestStarted.current) {
      return;
    }
    enrollRequestStarted.current = true;
    void loadEnrollment();
  }, [loadEnrollment]);

  async function submitEnrollmentConfirm(token: string) {
    const trimmed = token.trim();
    if (trimmed.length !== TOTP_CODE_LENGTH || confirmInFlight.current || submitting) {
      return;
    }

    confirmInFlight.current = true;
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/twofactor/totp/confirm', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed })
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; totpEnabled: boolean }
        | { ok: false; message: string }
        | null;
      if (!response.ok || !body?.ok) {
        setError(
          body && 'message' in body && body.message
            ? body.message
            : `Could not confirm enrollment (HTTP ${response.status}).`
        );
        setSubmitting(false);
        return;
      }
      onEnrolled();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setSubmitting(false);
    } finally {
      confirmInFlight.current = false;
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitEnrollmentConfirm(code);
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Preparing authenticator setup…
      </p>
    );
  }

  if (!enrollData) {
    return (
      <div className="space-y-4">
        {error ? <FineractErrorAlert message={error} /> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              enrollRequestStarted.current = false;
              void loadEnrollment();
            }}
          >
            Try again
          </Button>
          <Button type="button" variant="link" className="h-auto px-0 text-muted-foreground" onClick={onBack}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Scan the QR code with your authenticator app, or enter the secret key manually. Then enter
        the 6-digit code to finish setup.
      </p>

      {enrollData.qrDataUrl ? (
        <div className="flex justify-center rounded-lg border border-border bg-background p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrollData.qrDataUrl}
            alt="QR code for authenticator app enrollment"
            width={200}
            height={200}
            className="size-[200px]"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSecret((current) => !current)}
        >
          {showSecret ? 'Hide secret key' : 'Enter secret key manually'}
        </Button>
        {showSecret ? (
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">Secret key</p>
            <p className="mt-1 break-all font-mono text-sm">{enrollData.secret}</p>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleConfirm} className="space-y-4" aria-busy={submitting}>
        <VerificationCodeField
          id="totpConfirmCode"
          label="6-digit code"
          value={code}
          onChange={setCode}
          length={TOTP_CODE_LENGTH}
          disabled={submitting}
          autoFocus
          onComplete={(value) => void submitEnrollmentConfirm(value)}
        />

        {error ? <FineractErrorAlert message={error} /> : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full text-base font-semibold shadow-sm"
          disabled={submitting || code.length !== TOTP_CODE_LENGTH}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Confirming…
            </>
          ) : (
            'Confirm and continue'
          )}
        </Button>
      </form>

      <Button
        type="button"
        variant="link"
        className="h-auto px-0 text-muted-foreground"
        disabled={submitting}
        onClick={onBack}
      >
        Back to sign in
      </Button>
    </div>
  );
}
