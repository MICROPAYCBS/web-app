/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption } from '../clients/types';

export interface FineractStaff {
  id: number;
  firstname?: string;
  lastname?: string;
  displayName?: string;
  officeId?: number;
  officeName?: string;
  isLoanOfficer?: boolean;
  isActive?: boolean;
  mobileNo?: string;
  joiningDate?: number[] | string;
  allowedOffices?: FineractOfficeOption[];
}

export type FineractStaffListItem = Pick<
  FineractStaff,
  'id' | 'firstname' | 'lastname' | 'officeName' | 'isLoanOfficer' | 'isActive'
>;

export interface FineractStaffEditTemplate extends FineractStaff {
  allowedOffices?: FineractOfficeOption[];
}
