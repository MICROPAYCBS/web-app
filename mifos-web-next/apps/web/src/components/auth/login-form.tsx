'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Image from 'next/image';
import { ServerIcon } from 'lucide-react';
import { DemoLoginButton } from '@/components/auth/demo-login-button';
import { LoginNoServerEmpty } from '@/components/auth/login-no-server-empty';
import { LoginActiveServer } from '@/components/auth/login-active-server';
import type { ServerHealthSnapshot } from '@/components/servers/server-health-indicator';
import { ServerRowIconButton } from '@/components/servers/server-row-icon-button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { FineractServerProfile } from '@mifos/servers';
import { cn } from '@/lib/utils';

export interface LoginFormProps {
  redirectTo: string;
  demoEnabled: boolean;
  activeServer?: FineractServerProfile;
  signedOut?: boolean;
  loginError?: string | null;
  canSignIn?: boolean;
  onManageServers: () => void;
  serverHealth?: ServerHealthSnapshot;
  className?: string;
}

/**
 * login-04 layout — credentials POST to /api/auth/login (Route Handler, not server action).
 */
export function LoginForm({
  redirectTo,
  demoEnabled,
  activeServer,
  signedOut = false,
  loginError = null,
  canSignIn = true,
  onManageServers,
  serverHealth,
  className
}: LoginFormProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="flex flex-col p-6 md:p-8">
            <FieldGroup>
              {signedOut ? (
                <div
                  className="mb-4 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm text-muted-foreground"
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

              {canSignIn && activeServer ? (
                <LoginActiveServer server={activeServer} health={serverHealth} className="mt-4" />
              ) : null}

              {canSignIn ? (
                <form method="post" action="/api/auth/login" className="mt-4 space-y-4">
                  <input type="hidden" name="redirectTo" value={redirectTo} />

                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
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
                    />
                  </Field>
                  <Field orientation="horizontal">
                    <input
                      type="checkbox"
                      id="remember"
                      name="remember"
                      value="on"
                      className="size-4 rounded border border-input"
                    />
                    <FieldLabel htmlFor="remember" className="font-normal">
                      Remember me for 14 days
                    </FieldLabel>
                  </Field>

                  {loginError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {loginError}
                    </p>
                  ) : null}

                  <Field>
                    <Button type="submit" className="w-full">
                      Sign in
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
                </form>
              ) : (
                <div className="mt-4">
                  <LoginNoServerEmpty />
                </div>
              )}

              {canSignIn ? (
                <FieldSeparator className="my-6 *:data-[slot=field-separator-content]:bg-card">
                  Or continue with
                </FieldSeparator>
              ) : null}

              <div className={cn('flex gap-2', !canSignIn && 'mt-6')}>
                <ServerRowIconButton
                  label="Manage servers"
                  variant="outline"
                  onClick={onManageServers}
                  className="size-10"
                >
                  <ServerIcon className="size-4" />
                </ServerRowIconButton>
                <ThemeToggle variant="loginRow" className="h-10 min-w-0 flex-1" />
              </div>
            </FieldGroup>
          </div>

          <div className="relative hidden min-h-[min(100%,32rem)] md:block">
            <Image
              src="/images/cover_image_resized.webp"
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 0vw"
              priority
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
