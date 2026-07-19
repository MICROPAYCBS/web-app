/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Client-safe product status labels for list/detail UI. */
export function productStatusLabel(status?: string): string {
  if (!status) {
    return '—';
  }
  if (status.includes('active')) {
    return 'Active';
  }
  if (status.includes('inactive')) {
    return 'Inactive';
  }
  const segment = status.split('.').pop();
  if (!segment) {
    return status;
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function productStatusVariant(
  status?: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!status) {
    return 'secondary';
  }
  if (status.includes('active')) {
    return 'default';
  }
  if (status.includes('inactive')) {
    return 'outline';
  }
  return 'secondary';
}
