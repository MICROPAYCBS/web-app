'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useActionState } from 'react';
import { ServerIcon } from 'lucide-react';
import { loginAction, type LoginFormState } from '@/actions/auth';
import { DemoLoginButton } from '@/components/auth/demo-login-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const initialState: LoginFormState = { ok: true };

export interface LoginFormProps {
  redirectTo: string;
  demoEnabled: boolean;
  serverName: string;
  tenantId: string;
  signedOut?: boolean;
  canSignIn?: boolean;
  onManageServers: () => void;
  className?: string;
}

/**
 * login-04 layout — Fineract credentials via server action (no OAuth / sign-up).
 */
export function LoginForm({
  redirectTo,
  demoEnabled,
  serverName,
  tenantId,
  signedOut = false,
  canSignIn = true,
  onManageServers,
  className
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const signInDisabled = pending || !canSignIn;

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={formAction} className="p-6 md:p-8">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <FieldGroup>
              {signedOut ? (
                <div
                  className="rounded-lg border border-border bg-background px-3 py-2 text-center text-sm text-muted-foreground"
                  role="status"
                >
                  You have been signed out.
                </div>
              ) : null}

              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-bold">Sign in</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Credentials are sent to Fineract through this app&apos;s server only.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-sm">
                <p className="font-medium">{serverName}</p>
                <p className="text-xs text-muted-foreground">Tenant: {tenantId}</p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={onManageServers}
                >
                  <ServerIcon className="size-3.5" />
                  Manage servers
                </Button>
                {!canSignIn ? (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    Select or add a Fineract server before signing in.
                  </p>
                ) : null}
              </div>

              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={signInDisabled}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={signInDisabled}
                />
              </Field>
              <Field orientation="horizontal">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  value="on"
                  disabled={signInDisabled}
                  className="size-4 rounded border border-input"
                />
                <FieldLabel htmlFor="remember" className="font-normal">
                  Remember me for 14 days
                </FieldLabel>
              </Field>

              {state.ok === false && state.message ? (
                <p className="text-sm text-destructive" role="alert">
                  {state.message}
                </p>
              ) : null}

              <Field>
                <Button type="submit" className="w-full" disabled={signInDisabled}>
                  {pending ? 'Signing in…' : 'Sign in'}
                </Button>
              </Field>

              {demoEnabled ? (
                <>
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Preview only
                  </FieldSeparator>
                  <Field>
                    <DemoLoginButton className="w-full" disabled={!canSignIn} />
                  </Field>
                </>
              ) : null}
            </FieldGroup>
          </form>

          <div className="relative hidden flex-col justify-between bg-muted p-8 md:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mifos Web
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight">Apache Fineract®</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Modern client for microfinance and core banking — built with Next.js and
                shadcn/ui.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Preset <span className="font-mono">bJMSkfGi</span> · stone / nova
            </p>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-2 text-center text-xs">
        Use <span className="font-medium">Manage servers</span> to choose or configure your
        Fineract backend.
      </FieldDescription>
    </div>
  );
}
