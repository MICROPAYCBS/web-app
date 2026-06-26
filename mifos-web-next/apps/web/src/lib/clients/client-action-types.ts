/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type ClientActionSheetId =
  | 'assign-staff'
  | 'reassign-staff'
  | 'close'
  | 'transfer'
  | 'activate'
  | 'withdraw'
  | 'reject'
  | 'reactivate'
  | 'undo-rejection'
  | 'undo-transfer'
  | 'accept-transfer'
  | 'reject-transfer'
  | 'update-default-savings';

export type ClientActionDialogId =
  | 'upload-signature'
  | 'draw-signature'
  | 'delete-signature';

export type CodeValueOption = { id: number; name: string };

export type ClientActionSheetData =
  | { sheetId: 'assign-staff'; staffOptions: CodeValueOption[] }
  | {
      sheetId: 'reassign-staff';
      currentStaffName: string;
      staffOptions: CodeValueOption[];
    }
  | { sheetId: 'update-default-savings'; accounts: CodeValueOption[]; currentAccountId?: number }
  | { sheetId: 'close' | 'reject' | 'withdraw'; reasons: CodeValueOption[] }
  | { sheetId: 'transfer'; offices: CodeValueOption[] }
  | {
      sheetId: 'accept-transfer' | 'reject-transfer' | 'undo-transfer';
      transferDate: string | null;
    }
  | {
      sheetId: 'activate';
      savingsProductName?: string;
    }
  | { sheetId: 'reactivate' | 'undo-rejection' };
