'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_PASSWORD_POLICY,
  validatePasswordAgainstPolicy,
  type PasswordPolicyRules
} from '@/lib/password-policy-validate';

type PasswordField = 'password' | 'repeatPassword';

type PasswordFieldErrors = Partial<Record<PasswordField, string>>;

function validatePasswordFields(
  password: string,
  repeatPassword: string,
  policy: PasswordPolicyRules
): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {};
  const passwordError = validatePasswordAgainstPolicy(password, policy);
  if (passwordError) {
    errors.password = passwordError;
  }
  if (!repeatPassword) {
    errors.repeatPassword = 'Please confirm your password';
  } else if (password && password !== repeatPassword) {
    errors.repeatPassword = 'Passwords do not match';
  }
  return errors;
}

export function ChangePasswordDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PasswordPolicyRules>(DEFAULT_PASSWORD_POLICY);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/auth/password-policy');
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as PasswordPolicyRules;
        if (!cancelled && data?.minLength) {
          setPolicy(data);
        }
      } catch {
        /* keep default policy */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function resetForm() {
    setPassword('');
    setRepeatPassword('');
    setFieldErrors({});
    setFormError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetForm();
    }
    onOpenChange(next);
  }

  function clearFieldError(field: PasswordField) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nextFieldErrors = validatePasswordFields(password, repeatPassword, policy);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, repeatPassword })
        });
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          setFormError(data.message ?? 'Could not change password');
          return;
        }
        handleOpenChange(false);
      } catch {
        setFormError('Could not change password');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>{policy.hint}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup className="gap-4">
            <Field data-invalid={fieldErrors.password ? true : undefined}>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  clearFieldError('password');
                  setPassword(e.target.value);
                }}
                required
                aria-invalid={!!fieldErrors.password}
              />
              <FieldError>{fieldErrors.password}</FieldError>
            </Field>
            <Field data-invalid={fieldErrors.repeatPassword ? true : undefined}>
              <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={repeatPassword}
                onChange={(e) => {
                  clearFieldError('repeatPassword');
                  setRepeatPassword(e.target.value);
                }}
                required
                aria-invalid={!!fieldErrors.repeatPassword}
              />
              <FieldError>{fieldErrors.repeatPassword}</FieldError>
            </Field>
          </FieldGroup>

          {formError ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <DialogFooter className="mt-6 flex flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Update password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
