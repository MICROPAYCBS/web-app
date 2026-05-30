'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Image from 'next/image';
import { DemoLoginButton } from '@/components/auth/demo-login-button';
import { LoginNoServerEmpty } from '@/components/auth/login-no-server-empty';
import { LoginActiveServer } from '@/components/auth/login-active-server';
import type { ServerHealthSnapshot } from '@/components/servers/server-health-indicator';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { FineractServerProfile } from '@mifos/servers';
import { cn } from '@/lib/utils';

export interface LoginFormProps {
  redirectTo: string;
  demoEnabled: boolean;
  activeServer?: FineractServerProfile;
  loginError?: string | null;
  canSignIn?: boolean;
  onManageServers: () => void;
  serverHealth?: ServerHealthSnapshot;
  className?: string;
}

export function LoginForm({
  redirectTo,
  demoEnabled,
  activeServer,
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
          <div className="relative flex flex-col p-6 md:p-8">
            <ThemeToggle variant="icon" className="absolute top-4 right-4" />
            <FieldGroup>
              <h1 className="pr-10 text-center text-2xl font-bold">Sign in</h1>

              {canSignIn && activeServer ? (
                <LoginActiveServer
                  server={activeServer}
                  health={serverHealth}
                  onManageServers={onManageServers}
                  className="mt-6"
                />
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
                      <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card" />
                      <Field>
                        <DemoLoginButton className="w-full" />
                      </Field>
                    </>
                  ) : null}
                </form>
              ) : (
                <div className="mt-6">
                  <LoginNoServerEmpty onManageServers={onManageServers} />
                </div>
              )}
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
