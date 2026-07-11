'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCurrencyOption,
  FineractJournalEntryGlAccountOption,
  FineractOfficeOption,
  FineractPaymentTypeOption
} from '@mifos/api-client';
import type {
  CentralBranchExpensePaymentFormInput,
  CentralBranchExpensePaymentValidationContext
} from '@mifos/validation';
import type { Department } from '@/lib/fineract/departments';

export type CentralBranchPaymentWizardProps = {
  initialValues: CentralBranchExpensePaymentFormInput;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  paymentTypes: FineractPaymentTypeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  validationContext: CentralBranchExpensePaymentValidationContext;
  clearingGlAccountId: number;
  clearingGlAccountLabel: string;
  clearingWarning?: string;
};

export type CentralBranchPaymentStepProps = {
  form: CentralBranchExpensePaymentFormInput;
  errors: Record<string, string>;
  pending: boolean;
  onPatch: (patch: Partial<CentralBranchExpensePaymentFormInput>) => void;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  paymentTypes: FineractPaymentTypeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  validationContext: CentralBranchExpensePaymentValidationContext;
  clearingGlAccountId: number;
  clearingGlAccountLabel: string;
  clearingWarning?: string;
};
