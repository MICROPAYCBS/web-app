'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { ErrorPanel } from '@/components/composites/error-panel';
import { fineractUserErrorMessage, isFineractUserError } from '@/lib/errors/is-fineract-user-error';

export function RouteErrorPanel({
  error,
  reset,
  variant = 'page',
  className,
  fineractTitle = "We couldn't complete that request",
  unknownTitle,
  unknownDescription
}: {
  error: Error & { digest?: string };
  reset: () => void;
  variant?: 'page' | 'inline';
  className?: string;
  fineractTitle?: string;
  unknownTitle?: string;
  unknownDescription?: string;
}) {
  if (isFineractUserError(error)) {
    return (
      <FineractErrorAlert
        title={fineractTitle}
        message={fineractUserErrorMessage(error) ?? 'Something went wrong.'}
        onRetry={reset}
        className={className ?? (variant === 'page' ? 'mx-auto mt-16 max-w-lg' : undefined)}
      />
    );
  }

  return (
    <ErrorPanel
      error={error}
      digest={error.digest}
      onReset={reset}
      variant={variant}
      title={unknownTitle}
      description={unknownDescription}
      className={className ?? (variant === 'page' ? 'min-h-screen' : undefined)}
    />
  );
}
