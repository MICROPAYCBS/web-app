'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useActionState } from 'react';
import { loginAction, type LoginFormState } from '@/actions/auth';
import { DemoLoginButton } from '@/components/auth/demo-login-button';
import { AppLink } from '@/components/routes/app-link';
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
  className
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={formAction} className="p-6 md:p-8">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <FieldGroup>
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-bold">Sign in</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Credentials are sent to Fineract through this app&apos;s server only.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-sm">
                <p className="font-medium">{serverName}</p>
                <p className="text-xs text-muted-foreground">Tenant: {tenantId}</p>
                <AppLink
                  route="connect"
                  className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                >
                  Change server
                </AppLink>
              </div>

              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={pending}
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
                  disabled={pending}
                />
              </Field>
              <Field orientation="horizontal">
                <input type="checkbox" id="remember" name="remember" value="on" disabled={pending} className="size-4 rounded border border-input" />
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
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? 'Signing in…' : 'Sign in'}
                </Button>
              </Field>

              {demoEnabled ? (
                <>
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Preview only
                  </FieldSeparator>
                  <Field>
                    <DemoLoginButton className="w-full" />
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
              <p className="mt-4 text-2xl font-semibold tracking-tight">
                Apache Fineract®
              </p>
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
        By signing in you connect to the Fineract instance selected on the previous step.
      </FieldDescription>
    </div>
  );
}
