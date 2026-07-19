'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ConnectRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?servers=1');
  }, [router]);

  return (
    <p className="p-6 text-center text-sm text-muted-foreground">Opening sign in…</p>
  );
}
