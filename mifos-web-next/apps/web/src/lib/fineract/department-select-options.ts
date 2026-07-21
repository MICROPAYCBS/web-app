/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { Department } from '@/lib/fineract/department-types';

export function departmentSelectOptions(departments: Department[]) {
  return departments.map((department) => ({
    value: String(department.id),
    label: department.departmentName,
    keywords: [department.departmentCode]
  }));
}
