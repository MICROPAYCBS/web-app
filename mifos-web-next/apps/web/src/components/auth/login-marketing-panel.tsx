/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_LOGO_ABBREV, LOGIN_HEADLINE } from '@/lib/branding';
import { cn } from '@/lib/utils';

export function LoginMarketingPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-muted px-8 py-12 lg:px-12',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-muted to-background"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
          {APP_LOGO_ABBREV}
        </div>
        <p className="mt-10 text-balance text-2xl font-semibold leading-snug tracking-tight text-foreground lg:text-3xl">
          {LOGIN_HEADLINE}
        </p>
      </div>
    </div>
  );
}
