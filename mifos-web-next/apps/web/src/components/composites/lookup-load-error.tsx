'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';

export function LookupLoadError({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <FineractErrorAlert
      title="Couldn't load options"
      message={message}
      hint="Your other answers are still here. Retry loading, then continue."
      onRetry={onRetry}
    />
  );
}
