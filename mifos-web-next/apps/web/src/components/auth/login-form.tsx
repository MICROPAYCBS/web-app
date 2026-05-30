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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: LoginFormState = { ok: true };

export function LoginForm({
  redirectTo,
  demoEnabled
}: {
  redirectTo: string;
  demoEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="remember"
            className="size-4 rounded border border-input"
            disabled={pending}
          />
          Remember me for 14 days
        </label>
        {state.ok === false && state.message ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      {demoEnabled ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Preview only</span>
            </div>
          </div>
          <DemoLoginButton className="w-full" />
          <p className="text-center text-xs text-muted-foreground">
            Demo session skips Fineract credentials. Do not enable in production.
          </p>
        </>
      ) : null}
    </div>
  );
}
