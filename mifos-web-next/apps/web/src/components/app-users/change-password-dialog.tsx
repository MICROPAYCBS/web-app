'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage, validateChangeUserPassword } from '@mifos/validation';
import { useEffect, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { changeUserPasswordAction } from '@/actions/app-users';
import { PasswordPolicyChecklist } from '@/components/composites/password-policy-checklist';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { usePasswordPolicy } from '@/hooks/use-password-policy';
import { validatePasswordAgainstPolicy } from '@/lib/password-policy-validate';

export function ChangePasswordDialog({
  open,
  onOpenChange,
  userId,
  firstname
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  firstname: string;
}) {
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { policy, loading: policyLoading } = usePasswordPolicy(open);

  useEffect(() => {
    if (open) {
      setPassword('');
      setRepeatPassword('');
      setFieldErrors({});
      setSubmitError(null);
    }
  }, [open]);

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    const policyError = validatePasswordAgainstPolicy(password, policy);
    if (policyError) {
      nextErrors.password = policyError;
    }
    if (!repeatPassword.trim()) {
      nextErrors.repeatPassword = 'Confirm password is required.';
    } else if (password !== repeatPassword) {
      nextErrors.repeatPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    const parsed = validateChangeUserPassword({
      firstname,
      password,
      repeatPassword
    });
    if (!parsed.success) {
      const zodErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') {
          zodErrors[key] = issue.message;
        }
      }
      setFieldErrors(zodErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    setSubmitError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await changeUserPasswordAction(userId, parsed.data);
      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: 'Password updated.', pending: 'Password updated sent for approval.' });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Set a new password for this user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <TextField
            label="New password"
            required
            type="password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (fieldErrors.password) {
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next.password;
                  return next;
                });
              }
            }}
            disabled={pending}
            error={fieldErrors.password}
            autoComplete="new-password"
          />
          {!policyLoading ? (
            <PasswordPolicyChecklist password={password} policy={policy} />
          ) : null}
          <TextField
            label="Confirm password"
            required
            type="password"
            value={repeatPassword}
            onChange={(value) => {
              setRepeatPassword(value);
              if (fieldErrors.repeatPassword) {
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next.repeatPassword;
                  return next;
                });
              }
            }}
            disabled={pending}
            error={fieldErrors.repeatPassword}
            autoComplete="new-password"
          />
          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? 'Saving…' : 'Change password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
