/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractStaffListItem } from '@mifos/api-client';
import type { BranchManagerOption } from '@/components/organization/branch-form-sheet';

export function toBranchManagerOptions(staff: FineractStaffListItem[]): BranchManagerOption[] {
  return staff
    .filter((member) => member.isActive !== false)
    .map((member) => ({
      id: member.id,
      label: [member.lastname, member.firstname].filter(Boolean).join(', ') || `Staff #${member.id}`
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}
