'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OtpDeliveryMethod } from '@mifos/api-client';
import { Loader2, ShieldCheckIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { DemoLoginButton } from '@/components/auth/demo-login-button';
import { LoginMarketingPanel } from '@/components/auth/login-marketing-panel';
import { LoginNoServerEmpty } from '@/components/auth/login-no-server-empty';
import { LoginActiveServer } from '@/components/auth/login-active-server';
import { TotpEnrollmentStep } from '@/components/auth/totp-enrollment-step';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { VerificationCodeField } from '@/components/composites/verification-code-field';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { PasswordInput } from '@/components/composites/password-input';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { FineractServerProfile } from '@mifos/servers';
import { APP_NAME } from '@/lib/branding';
import { LOGIN_JSON_ACCEPT, type LoginApiResponse } from '@/lib/auth/login-api';
import { cn } from '@/lib/utils';

type DeliveryMethod = { name: string; target?: string };

type TwoFactorContext = {
  deliveryMethod?: OtpDeliveryMethod;
  totpEnabled?: boolean;
  totpEnrollmentRequired?: boolean;
};

type TwoFactorPhase = 'enroll' | 'requestOtp' | 'enterCode';

function resolveTwoFactorPhase(context: TwoFactorContext): TwoFactorPhase {
  const needsTotpEnrollment =
    context.totpEnrollmentRequired === true ||
    (context.deliveryMethod === 'totp' && context.totpEnabled !== true);
  if (needsTotpEnrollment) {
    return 'enroll';
  }
  if (context.deliveryMethod === 'totp') {
    return 'enterCode';
  }
  return 'requestOtp';
}

function twoFactorSubtitle(context: TwoFactorContext, phase: TwoFactorPhase): string {
  if (phase === 'enroll') {
    return 'Set up your authenticator app to finish signing in.';
  }
  if (context.deliveryMethod === 'totp') {
    return 'Enter the code from your authenticator app.';
  }
  if (phase === 'enterCode') {
    return 'Enter the verification code sent to you to finish signing in.';
  }
  return 'Request a verification code to finish signing in.';
}

export interface LoginFormProps {
  redirectTo: string;
  demoEnabled: boolean;
  activeServer?: FineractServerProfile;
  loginError?: string | null;
  loginSuccess?: string | null;
  canSignIn?: boolean;
  onManageServers: () => void;
  className?: string;
}

export function LoginForm({
  redirectTo,
  demoEnabled,
  activeServer,
  loginError = null,
  loginSuccess = null,
  canSignIn = true,
  onManageServers,
  className
}: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<'password' | 'twoFactor'>('password');
  const [twoFactorContext, setTwoFactorContext] = useState<TwoFactorContext>({});
  const [twoFactorPhase, setTwoFactorPhase] = useState<TwoFactorPhase>('requestOtp');
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [tokenLiveTimeInSec, setTokenLiveTimeInSec] = useState<number | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const verifyInFlight = useRef(false);

  const verificationCodeLength = 6;

  const applyTwoFactorSession = useCallback((context: TwoFactorContext, methods: DeliveryMethod[]) => {
    setTwoFactorContext(context);
    setTwoFactorPhase(resolveTwoFactorPhase(context));
    setDeliveryMethods(methods);
    if (methods.length === 1) {
      setSelectedDeliveryMethod(methods[0].name);
    } else if (context.deliveryMethod) {
      setSelectedDeliveryMethod(context.deliveryMethod);
    }
    setStep('twoFactor');
  }, []);

  const loadPendingTwoFactor = useCallback(async () => {
    setLoadingMethods(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/auth/twofactor/delivery-methods', {
        credentials: 'same-origin'
      });
      const body = (await response.json().catch(() => null)) as
        | {
            ok: true;
            methods: DeliveryMethod[];
            deliveryMethod?: OtpDeliveryMethod;
            totpEnabled?: boolean;
            totpEnrollmentRequired?: boolean;
          }
        | { ok: false; message: string }
        | null;
      if (!body?.ok) {
        setSubmitError(body?.message ?? 'Could not load verification options.');
        setStep('password');
        return;
      }
      applyTwoFactorSession(
        {
          deliveryMethod: body.deliveryMethod,
          totpEnabled: body.totpEnabled,
          totpEnrollmentRequired: body.totpEnrollmentRequired
        },
        body.methods
      );
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.');
      setStep('password');
    } finally {
      setLoadingMethods(false);
    }
  }, [applyTwoFactorSession]);

  useEffect(() => {
    if (!canSignIn) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/auth/twofactor/delivery-methods', {
          credentials: 'same-origin'
        });
        if (!response.ok || cancelled) {
          return;
        }
        const body = (await response.json().catch(() => null)) as
          | {
              ok: true;
              methods: DeliveryMethod[];
              deliveryMethod?: OtpDeliveryMethod;
              totpEnabled?: boolean;
              totpEnrollmentRequired?: boolean;
            }
          | { ok: false; message: string }
          | null;
        if (!body?.ok || cancelled) {
          return;
        }
        applyTwoFactorSession(
          {
            deliveryMethod: body.deliveryMethod,
            totpEnabled: body.totpEnabled,
            totpEnrollmentRequired: body.totpEnrollmentRequired
          },
          body.methods
        );
      } catch {
        // No pending 2FA cookie — stay on password step.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canSignIn, applyTwoFactorSession]);

  useEffect(() => {
    if (
      step === 'twoFactor' &&
      twoFactorPhase === 'requestOtp' &&
      deliveryMethods.length === 0 &&
      !loadingMethods
    ) {
      void loadPendingTwoFactor();
    }
  }, [step, twoFactorPhase, deliveryMethods.length, loadingMethods, loadPendingTwoFactor]);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: {
          Accept: LOGIN_JSON_ACCEPT
        }
      });

      const body = (await response.json().catch(() => null)) as LoginApiResponse | null;
      if (body?.ok && 'needsTwoFactor' in body && body.needsTwoFactor) {
        setIsSubmitting(false);
        setOtpRequested(false);
        setOtp('');
        setTokenLiveTimeInSec(null);
        setDeliveryMethods([]);
        setSelectedDeliveryMethod('');
        applyTwoFactorSession(
          {
            deliveryMethod: body.deliveryMethod,
            totpEnabled: body.totpEnabled,
            totpEnrollmentRequired: body.totpEnrollmentRequired
          },
          []
        );
        return;
      }

      if (body?.ok && 'redirectTo' in body && body.redirectTo) {
        window.location.assign(body.redirectTo);
        return;
      }

      setIsSubmitting(false);
      setSubmitError(body && 'message' in body ? body.message : 'Sign-in failed. Please try again.');
    } catch {
      setIsSubmitting(false);
      setSubmitError('Could not reach the server. Check your connection and try again.');
    }
  }

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = selectedDeliveryMethod || twoFactorContext.deliveryMethod;
    if (!method) {
      setSubmitError('Verification method is not available. Sign in again.');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/twofactor/request', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryMethod: method })
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; tokenLiveTimeInSec?: number }
        | { ok: false; message: string }
        | null;
      if (!body?.ok) {
        setSubmitError(body?.message ?? 'Could not send the verification code.');
        setIsSubmitting(false);
        return;
      }
      setTokenLiveTimeInSec(body.tokenLiveTimeInSec ?? null);
      setOtpRequested(true);
      setTwoFactorPhase('enterCode');
      setIsSubmitting(false);
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.');
      setIsSubmitting(false);
    }
  }

  async function submitVerificationCode(token: string) {
    const trimmed = token.trim();
    if (trimmed.length !== verificationCodeLength || verifyInFlight.current || isSubmitting) {
      return;
    }

    verifyInFlight.current = true;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/twofactor/validate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed })
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; redirectTo: string }
        | { ok: false; message: string }
        | null;
      if (body?.ok && body.redirectTo) {
        window.location.assign(body.redirectTo);
        return;
      }
      setIsSubmitting(false);
      setSubmitError(body && 'message' in body ? body.message : 'Invalid verification code.');
    } catch {
      setIsSubmitting(false);
      setSubmitError('Could not reach the server. Check your connection and try again.');
    } finally {
      verifyInFlight.current = false;
    }
  }

  async function handleValidateOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitVerificationCode(otp);
  }

  function backToPassword() {
    void fetch('/api/auth/twofactor/cancel', {
      method: 'POST',
      credentials: 'same-origin'
    }).catch(() => undefined);
    setStep('password');
    setTwoFactorPhase('requestOtp');
    setTwoFactorContext({});
    setOtpRequested(false);
    setOtp('');
    setSubmitError(null);
    setDeliveryMethods([]);
    setSelectedDeliveryMethod('');
    setTokenLiveTimeInSec(null);
  }

  function handleEnrollmentComplete() {
    setTwoFactorContext((current) => ({
      ...current,
      totpEnrollmentRequired: false,
      totpEnabled: true,
      deliveryMethod: 'totp'
    }));
    setTwoFactorPhase('enterCode');
    setOtp('');
    setSubmitError(null);
  }

  const displayedError = submitError ?? (isSubmitting || step === 'twoFactor' ? null : loginError);
  const deliveryTarget =
    deliveryMethods.find(
      (method) =>
        method.name === selectedDeliveryMethod ||
        method.name === twoFactorContext.deliveryMethod
    )?.target ?? deliveryMethods[0]?.target;

  return (
    <div className={cn('grid min-h-svh lg:grid-cols-2', className)}>
      <LoginMarketingPanel className="min-h-48 lg:min-h-svh" />

      <div className="relative flex flex-col bg-background">
        <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
          <ThemeToggle variant="icon" />
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {step === 'twoFactor' ? 'Verify your identity' : `Sign in to ${APP_NAME}`}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === 'twoFactor'
                  ? twoFactorSubtitle(twoFactorContext, twoFactorPhase)
                  : 'Enter your institution credentials.'}
              </p>
            </div>

            <FieldGroup className="gap-0">
              {canSignIn && activeServer ? (
                <LoginActiveServer
                  server={activeServer}
                  onManageServers={onManageServers}
                  className="mb-1"
                />
              ) : null}

              {canSignIn && step === 'password' ? (
                <form
                  method="post"
                  action="/api/auth/login"
                  onSubmit={handlePasswordSubmit}
                  className={cn('space-y-4', activeServer ? 'mt-5' : 'mt-0')}
                  aria-busy={isSubmitting}
                >
                  <input type="hidden" name="redirectTo" value={redirectTo} />

                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      className="h-10 bg-background"
                      required
                      disabled={isSubmitting}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <PasswordInput
                      id="password"
                      name="password"
                      value={password}
                      onChange={setPassword}
                      autoComplete="current-password"
                      className="h-10 bg-background"
                      required
                      disabled={isSubmitting}
                    />
                  </Field>

                  {loginSuccess ? (
                    <div
                      className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground"
                      role="status"
                    >
                      {loginSuccess}
                    </div>
                  ) : null}

                  {displayedError ? <FineractErrorAlert message={displayedError} /> : null}

                  <Field className="pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-11 w-full text-base font-semibold shadow-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                          Signing in…
                        </>
                      ) : (
                        'Sign in'
                      )}
                    </Button>
                  </Field>

                  {demoEnabled ? (
                    <>
                      <FieldSeparator />
                      <Field>
                        <DemoLoginButton className="w-full" disabled={isSubmitting} />
                      </Field>
                    </>
                  ) : null}
                </form>
              ) : null}

              {canSignIn && step === 'twoFactor' ? (
                <div className={cn('space-y-4', activeServer ? 'mt-5' : 'mt-0')}>
                  {twoFactorPhase === 'enroll' ? (
                    <TotpEnrollmentStep onEnrolled={handleEnrollmentComplete} onBack={backToPassword} />
                  ) : null}

                  {twoFactorPhase === 'requestOtp' ? (
                    <>
                      {loadingMethods ? (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Loading verification options…
                        </p>
                      ) : null}

                      {!loadingMethods && !otpRequested ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4" aria-busy={isSubmitting}>
                          {deliveryTarget ? (
                            <p className="text-sm text-muted-foreground">
                              A code will be sent to{' '}
                              <span className="font-medium text-foreground">{deliveryTarget}</span>.
                            </p>
                          ) : null}

                          {submitError ? <FineractErrorAlert message={submitError} /> : null}

                          <Field className="pt-2">
                            <Button
                              type="submit"
                              size="lg"
                              className="h-11 w-full text-base font-semibold shadow-sm"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                                  Sending code…
                                </>
                              ) : (
                                'Send code'
                              )}
                            </Button>
                          </Field>
                        </form>
                      ) : null}
                    </>
                  ) : null}

                  {twoFactorPhase === 'enterCode' ? (
                    <form onSubmit={handleValidateOtp} className="space-y-4" aria-busy={isSubmitting}>
                      <VerificationCodeField
                        id="otp"
                        label={
                          twoFactorContext.deliveryMethod === 'totp'
                            ? 'Authenticator code'
                            : 'Verification code'
                        }
                        value={otp}
                        onChange={setOtp}
                        length={verificationCodeLength}
                        disabled={isSubmitting}
                        autoFocus
                        onComplete={(value) => void submitVerificationCode(value)}
                      />
                      {tokenLiveTimeInSec && twoFactorContext.deliveryMethod !== 'totp' ? (
                        <p className="text-xs text-muted-foreground">
                          Code is valid for about {Math.max(1, Math.round(tokenLiveTimeInSec / 60))}{' '}
                          minutes.
                        </p>
                      ) : null}

                      {submitError ? <FineractErrorAlert message={submitError} /> : null}

                      <Field className="pt-2">
                        <Button
                          type="submit"
                          size="lg"
                          className="h-11 w-full text-base font-semibold shadow-sm"
                          disabled={isSubmitting || otp.length !== verificationCodeLength}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                              Verifying…
                            </>
                          ) : (
                            'Verify and sign in'
                          )}
                        </Button>
                      </Field>

                      {twoFactorContext.deliveryMethod !== 'totp' ? (
                        <Field>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            disabled={isSubmitting}
                            onClick={() => {
                              setOtpRequested(false);
                              setOtp('');
                              setTwoFactorPhase('requestOtp');
                              setSubmitError(null);
                            }}
                          >
                            Resend code
                          </Button>
                        </Field>
                      ) : null}
                    </form>
                  ) : null}

                  {twoFactorPhase !== 'enroll' ? (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-muted-foreground"
                      disabled={isSubmitting}
                      onClick={backToPassword}
                    >
                      Back to sign in
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {!canSignIn ? <LoginNoServerEmpty onManageServers={onManageServers} /> : null}
            </FieldGroup>
          </div>
        </div>

        <div className="border-t border-border/80 bg-muted/30 px-6 py-4 sm:px-10 lg:px-16">
          <p className="mx-auto flex max-w-sm items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-4 shrink-0 text-primary" aria-hidden />
            Authorized personnel only. Activity is logged for security and compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
