/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export default function ShareAccountLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-40 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
