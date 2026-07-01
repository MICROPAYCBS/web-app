'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Loader2, ShieldCheckIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DemoLoginButton } from '@/components/auth/demo-login-button';
import { LoginMarketingPanel } from '@/components/auth/login-marketing-panel';
import { LoginNoServerEmpty } from '@/components/auth/login-no-server-empty';
import { LoginActiveServer } from '@/components/auth/login-active-server';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { PasswordInput } from '@/components/composites/password-input';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { FineractServerProfile } from '@mifos/servers';
import { APP_NAME } from '@/lib/branding';
import { LOGIN_JSON_ACCEPT, type LoginApiResponse } from '@/lib/auth/login-api';
import { cn } from '@/lib/utils';

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      if (body?.ok) {
        window.location.assign(body.redirectTo);
        return;
      }

      setIsSubmitting(false);
      setSubmitError(body?.message ?? 'Sign-in failed. Please try again.');
    } catch {
      setIsSubmitting(false);
      setSubmitError('Could not reach the server. Check your connection and try again.');
    }
  }

  const displayedError = submitError ?? loginError;

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
                Sign in to {APP_NAME}
              </h1>
              <p className="text-sm text-muted-foreground">Enter your institution credentials.</p>
            </div>

            <FieldGroup className="gap-0">
              {canSignIn && activeServer ? (
                <LoginActiveServer
                  server={activeServer}
                  onManageServers={onManageServers}
                  className="mb-1"
                />
              ) : null}

              {canSignIn ? (
                <form
                  onSubmit={handleSubmit}
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

                  {displayedError ? (
                    <div
                      className="max-h-64 overflow-auto rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm whitespace-pre-wrap text-destructive"
                      role="alert"
                    >
                      {displayedError}
                    </div>
                  ) : null}

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
              ) : (
                <LoginNoServerEmpty onManageServers={onManageServers} />
              )}
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
