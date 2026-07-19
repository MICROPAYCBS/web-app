/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export function ComingSoonPage({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-prose text-muted-foreground">
        {description ??
          'This screen is registered in navigation and will be implemented in a future iteration.'}
      </p>
    </div>
  );
}
