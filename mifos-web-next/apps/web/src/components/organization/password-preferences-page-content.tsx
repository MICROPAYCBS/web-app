'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { PasswordPreferenceTemplateItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { updatePasswordPreferencesAction } from '@/actions/password-preferences';
import { ListPage } from '@/components/composites/list-page';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import {
  findActivePasswordPreferenceId,
  passwordPreferenceDescription,
  passwordPreferenceLabel
} from '@/lib/fineract/password-preferences-display';
import { cn } from '@/lib/utils';

export function PasswordPreferencesPageContent({
  preferences,
  canUpdate
}: {
  preferences: PasswordPreferenceTemplateItem[];
  canUpdate: boolean;
}) {
  const initialPolicyId = useMemo(() => findActivePasswordPreferenceId(preferences), [preferences]);
  const [validationPolicyId, setValidationPolicyId] = useState<number | null>(initialPolicyId);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const dirty = validationPolicyId !== initialPolicyId;
  const disabled = pending || !canUpdate;

  function handleReset() {
    setValidationPolicyId(initialPolicyId);
    setFieldErrors({});
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    if (validationPolicyId == null) {
      setFieldErrors({ validationPolicyId: 'Password validation policy is required' });
      return;
    }

    startTransition(async () => {
      const result = await updatePasswordPreferencesAction({ validationPolicyId });

      if (!result.ok) {

        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        return;
      }
      toastCommandOutcome(result, { completed: 'Password preferences updated.', pending: 'Password preferences updated sent for approval.' });
        toast.error(result.message);
        return;
      }
    });
  }

  return (
    <ListPage
      title="Password preferences"
      description="Choose the password validation policy applied when users set or change passwords."
    >
      <form className="mx-auto max-w-3xl space-y-6" onSubmit={handleSubmit}>
        <fieldset className="space-y-4" disabled={disabled}>
          <legend className="sr-only">Password validation policy</legend>
          {preferences.map((preference) => {
            const selected = validationPolicyId === preference.id;
            return (
              <label
                key={preference.id}
                htmlFor={`password-preference-${preference.id}`}
                className={cn(
                  'block cursor-pointer rounded-lg border p-6 transition-colors',
                  selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-base font-medium">{passwordPreferenceLabel(preference)}</div>
                    <p className="text-sm text-muted-foreground">
                      {passwordPreferenceDescription(preference.description)}
                    </p>
                  </div>
                  <input
                    id={`password-preference-${preference.id}`}
                    type="radio"
                    name="validationPolicyId"
                    className="mt-1 size-4 shrink-0 accent-primary"
                    checked={selected}
                    onChange={() => setValidationPolicyId(preference.id)}
                  />
                </div>
              </label>
            );
          })}
        </fieldset>

        {fieldErrors.validationPolicyId ? (
          <FieldError>{fieldErrors.validationPolicyId}</FieldError>
        ) : null}

        <Can permission="UPDATE_PASSWORD_VALIDATION_POLICY">
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!dirty || pending}>
              Save changes
            </Button>
            <Button type="button" variant="outline" disabled={!dirty || pending} onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Can>
      </form>
    </ListPage>
  );
}
