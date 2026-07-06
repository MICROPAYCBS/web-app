/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionListItem, StandingInstructionTemplate } from '@mifos/api-client';
import type { CreateStandingInstructionFormDefaults } from '@/components/clients/standing-instructions/create-standing-instruction-sheet';
import type { LoanAccountStandingInstructionPermissions } from '@/components/clients/loan-account/loan-account-standing-instructions-section';

export type LoanAccountStandingInstructionContext = {
  clientName: string;
  fromOfficeId: number;
  items: StandingInstructionListItem[];
  createTemplate: StandingInstructionTemplate | null;
  permissions: LoanAccountStandingInstructionPermissions;
  canCreate: boolean;
  createFormDefaults: CreateStandingInstructionFormDefaults | null;
};
