'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import {
  DEFAULT_PASSWORD_POLICY,
  type PasswordPolicyRules
} from '@/lib/password-policy-validate';

/**
 * Loads the tenant's active Fineract password rules via BFF.
 * Falls back to {@link DEFAULT_PASSWORD_POLICY} when the request fails.
 */
export function usePasswordPolicy(enabled = true) {
  const [policy, setPolicy] = useState<PasswordPolicyRules>(DEFAULT_PASSWORD_POLICY);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
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
        /* keep default */
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { policy, loading };
}
