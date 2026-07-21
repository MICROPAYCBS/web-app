/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type Department = {
  id: number;
  departmentCode: string;
  departmentName: string;
  officeId?: number;
  officeName?: string;
  active?: boolean;
};
