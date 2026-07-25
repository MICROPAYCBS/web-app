'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  BranchFormSheet,
  type BranchManagerOption
} from '@/components/organization/branch-form-sheet';

type BranchCreateUrlPanelProps = {
  parentOptions: FineractOfficeOption[];
  managerOptions?: BranchManagerOption[];
  structuredAccountNumberFormatsEnabled?: boolean;
};

/** Opens the create branch sidebar when the URL contains `?create=1`. */
export function BranchCreateUrlPanel(props: BranchCreateUrlPanelProps) {
  return (
    <Suspense fallback={null}>
      <BranchCreateUrlPanelInner {...props} />
    </Suspense>
  );
}

function BranchCreateUrlPanelInner({
  parentOptions,
  managerOptions = [],
  structuredAccountNumberFormatsEnabled = false
}: BranchCreateUrlPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createRequested = searchParams.get('create') === '1';

  // Base UI Dialog portals only after open goes false→true on a mounted root.
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = window.setTimeout(() => setOpen(createRequested), 50);
    return () => window.clearTimeout(timer);
  }, [ready, createRequested]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next && searchParams.get('create') === '1') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('create');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!ready) {
    return null;
  }

  return (
    <BranchFormSheet
      open={open}
      onOpenChange={handleOpenChange}
      mode="create"
      parentOptions={parentOptions}
      managerOptions={managerOptions}
      structuredAccountNumberFormatsEnabled={structuredAccountNumberFormatsEnabled}
    />
  );
}
