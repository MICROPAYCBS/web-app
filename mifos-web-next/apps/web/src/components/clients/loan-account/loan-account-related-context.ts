/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientNote, FineractEntityDocument, LoanOriginatorListItem } from '@mifos/api-client';
import type {
  LoanCollateralRecord,
  LoanDelinquencyActionRecord,
  LoanDelinquencyTagRecord,
  LoanGuarantorRecord,
  LoanInterestPauseRecord
} from '@/lib/fineract/loan-account-types';

export type LoanAccountNotesContext = {
  items: FineractClientNote[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type LoanAccountDocumentsContext = {
  items: FineractEntityDocument[];
  canCreate: boolean;
  canDelete: boolean;
};

export type LoanAccountCollateralContext = {
  items: LoanCollateralRecord[];
  canCreate: boolean;
};

export type LoanAccountGuarantorsContext = {
  items: LoanGuarantorRecord[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type LoanAccountOriginatorsContext = {
  items: LoanOriginatorListItem[];
  canAttach: boolean;
  canDetach: boolean;
};

export type LoanAccountDelinquencyContext = {
  tags: LoanDelinquencyTagRecord[];
  actions: LoanDelinquencyActionRecord[];
  canPause: boolean;
};

export type LoanAccountInterestPausesContext = {
  items: LoanInterestPauseRecord[];
  canManage: boolean;
};

export type LoanAccountRelatedRecordsContext = {
  notes: LoanAccountNotesContext | null;
  documents: LoanAccountDocumentsContext;
  collateral: LoanAccountCollateralContext;
  guarantors: LoanAccountGuarantorsContext;
  originators: LoanAccountOriginatorsContext;
  delinquency: LoanAccountDelinquencyContext | null;
  interestPauses: LoanAccountInterestPausesContext | null;
  canEditTranches: boolean;
};
