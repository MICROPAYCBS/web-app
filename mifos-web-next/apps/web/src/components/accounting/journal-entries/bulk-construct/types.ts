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
  FineractOfficeOption
} from '@mifos/api-client';
import type {
  BulkConstructJournalEntriesFormInput,
  CreateJournalEntryValidationContext
} from '@mifos/validation';
import type { Department } from '@/lib/fineract/departments';

export type StepErrors = Record<string, string>;

export type BulkConstructWizardProps = {
  embedded?: boolean;
  initialValues: BulkConstructJournalEntriesFormInput;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  departments: Department[];
  accountingRules: FineractAccountingRuleListItem[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  validationContext: CreateJournalEntryValidationContext;
};

export type BulkConstructStepProps = BulkConstructWizardProps & {
  form: BulkConstructJournalEntriesFormInput;
  errors: StepErrors;
  pending: boolean;
  onPatch: (patch: Partial<BulkConstructJournalEntriesFormInput>) => void;
  onPatchTemplate: (
    patch: Partial<BulkConstructJournalEntriesFormInput['template']>
  ) => void;
  onPatchRows: (rows: BulkConstructJournalEntriesFormInput['rows']) => void;
};
