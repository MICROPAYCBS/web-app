'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useTransition } from 'react';
import { enterDemoSessionAction } from '@/actions/demo-login';
import { Button } from '@/components/ui/button';

export function DemoLoginButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      className={className}
      disabled={pending}
      onClick={() => startTransition(() => enterDemoSessionAction('/'))}
    >
      {pending ? 'Starting demo…' : 'Continue with demo session'}
    </Button>
  );
}
