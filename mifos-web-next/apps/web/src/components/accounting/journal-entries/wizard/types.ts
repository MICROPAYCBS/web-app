/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountingRuleListItem,
  FineractCurrencyOption,
  FineractJournalEntryGlAccountOption,
  FineractOfficeOption,
  FineractPaymentTypeOption
} from '@mifos/api-client';
import type {
  CreateJournalEntryFormInput,
  CreateJournalEntryValidationContext
} from '@mifos/validation';
import type { Department } from '@/lib/fineract/departments';

export type StepErrors = Record<string, string>;

export type JournalEntryWizardProps = {
  initialValues: CreateJournalEntryFormInput;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  paymentTypes: FineractPaymentTypeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  accountingRules: FineractAccountingRuleListItem[];
  validationContext: CreateJournalEntryValidationContext;
};

export type JournalEntryStepProps = {
  form: CreateJournalEntryFormInput;
  errors: StepErrors;
  pending: boolean;
  onPatch: (patch: Partial<CreateJournalEntryFormInput>) => void;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  paymentTypes: FineractPaymentTypeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  accountingRules: FineractAccountingRuleListItem[];
  validationContext: CreateJournalEntryValidationContext;
  onPostingTemplateChange: (value: string | undefined) => void;
};
