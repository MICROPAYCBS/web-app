'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Check, Circle } from 'lucide-react';
import { useMemo } from 'react';
import {
  buildPasswordPolicyChecks,
  type PasswordPolicyRules
} from '@/lib/password-policy-validate';
import { cn } from '@/lib/utils';

export function PasswordPolicyChecklist({
  password,
  policy,
  className,
  title = 'Password requirements'
}: {
  password: string;
  policy: PasswordPolicyRules;
  className?: string;
  title?: string;
}) {
  const checks = useMemo(
    () => buildPasswordPolicyChecks(password, policy),
    [password, policy]
  );

  return (
    <div className={cn('space-y-2', className)} aria-live="polite">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <ul className="space-y-1.5">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-sm">
            {check.met ? (
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
            ) : (
              <Circle
                className="mt-0.5 size-4 shrink-0 text-muted-foreground/50"
                aria-hidden
              />
            )}
            <span
              className={cn(
                check.met ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {check.label}
              <span className="sr-only">{check.met ? ' — met' : ' — not met'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
