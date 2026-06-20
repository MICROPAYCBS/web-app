/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type BulkImportFormFields = 0 | 1 | 2 | 3;

export interface BulkImportDefinition {
  name: string;
  entityType: string;
  urlSuffix: string;
  formFields: BulkImportFormFields;
  /** Permission required to see the option on the list page (legacy BulkImportComponent). */
  listPermission: string;
  /** Permission required to download template (legacy BulkImports). */
  downloadPermission: string;
  description: string;
}

/** Legacy list + detail configuration (openMF/web-app bulk-import). */
export const BULK_IMPORT_DEFINITIONS: BulkImportDefinition[] = [
  {
    name: 'Offices',
    entityType: 'offices',
    urlSuffix: '/offices',
    formFields: 0,
    listPermission: 'CREATE_OFFICE',
    downloadPermission: 'READ_OFFICE',
    description: 'Download and upload offices template'
  },
  {
    name: 'Users',
    entityType: 'users',
    urlSuffix: '/users',
    formFields: 2,
    listPermission: 'READ_USER',
    downloadPermission: 'READ_CLIENT',
    description: 'Download users template and upload user Excel files'
  },
  {
    name: 'Groups',
    entityType: 'groups',
    urlSuffix: '/groups',
    formFields: 2,
    listPermission: 'READ_GROUP',
    downloadPermission: 'READ_CLIENT',
    description: 'Download groups template and upload group Excel files'
  },
  {
    name: 'Loan Accounts',
    entityType: 'loans',
    urlSuffix: '/loans',
    formFields: 2,
    listPermission: 'READ_LOAN',
    downloadPermission: 'READ_CLIENT',
    description: 'Download loan accounts template and upload loan account Excel files'
  },
  {
    name: 'Savings Accounts',
    entityType: 'savingsaccount',
    urlSuffix: '/savingsaccounts',
    formFields: 2,
    listPermission: 'READ_SAVINGSACCOUNT',
    downloadPermission: 'READ_CLIENT',
    description: 'Download savings accounts template and upload savings account Excel files'
  },
  {
    name: 'Fixed Deposit Accounts',
    entityType: 'fixeddepositaccounts',
    urlSuffix: '/fixeddepositaccounts',
    formFields: 2,
    listPermission: 'READ_FIXEDDEPOSITACCOUNT',
    downloadPermission: 'READ_CLIENT',
    description: 'Download fixed deposit accounts template and upload Excel files'
  },
  {
    name: 'Chart of Accounts',
    entityType: 'chartofaccounts',
    urlSuffix: '/glaccounts',
    formFields: 2,
    listPermission: 'READ_GLACCOUNT',
    downloadPermission: 'READ_CLIENT',
    description: 'Download chart of accounts template and upload Excel files'
  },
  {
    name: 'Share Accounts',
    entityType: 'shareaccounts',
    urlSuffix: '/accounts/share',
    formFields: 1,
    listPermission: 'READ_SHAREACCOUNT',
    downloadPermission: 'READ_CLIENT',
    description: 'Download share accounts template and upload share account Excel files'
  },
  {
    name: 'Employees',
    entityType: 'staff',
    urlSuffix: '/staff',
    formFields: 1,
    listPermission: 'READ_STAFF',
    downloadPermission: 'READ_CLIENT',
    description: 'Download employees template and upload employee Excel files'
  },
  {
    name: 'Clients',
    entityType: 'client',
    urlSuffix: '/clients',
    formFields: 3,
    listPermission: 'READ_CLIENT',
    downloadPermission: 'READ_CLIENT',
    description: 'Download customers template and upload customer Excel files'
  },
  {
    name: 'Centers',
    entityType: 'centers',
    urlSuffix: '/centers',
    formFields: 2,
    listPermission: 'READ_CENTER',
    downloadPermission: 'READ_CENTERS',
    description: 'Download centers template and upload center Excel files'
  },
  {
    name: 'Loan Repayments',
    entityType: 'loantransactions',
    urlSuffix: '/loans/repayments',
    formFields: 1,
    listPermission: 'READ_LOAN',
    downloadPermission: 'READ_CLIENT',
    description: 'Download loan repayments template and upload repayment Excel files'
  },
  {
    name: 'Savings Transactions',
    entityType: 'savingstransactions',
    urlSuffix: '/savingsaccounts/transactions',
    formFields: 1,
    listPermission: 'READ_SAVINGSACCOUNT',
    downloadPermission: 'READ_CLIENT',
    description: 'Download savings transactions template and upload Excel files'
  },
  {
    name: 'Fixed Deposit Transactions',
    entityType: 'fixeddeposittransactions',
    urlSuffix: '/fixeddepositaccounts/transaction',
    formFields: 1,
    listPermission: 'READ_FIXEDDEPOSITACCOUNT',
    downloadPermission: 'READ_CLIENT',
    description: 'Download fixed deposit transactions template and upload Excel files'
  },
  {
    name: 'Recurring Deposit Transactions',
    entityType: 'recurringdepositstransactions',
    urlSuffix: '/recurringdepositaccounts/transactions',
    formFields: 1,
    listPermission: 'READ_RECURRINGDEPOSITACCOUNT',
    downloadPermission: 'READ_CLIENT',
    description: 'Download recurring deposit transactions template and upload Excel files'
  },
  {
    name: 'Journal Entries',
    entityType: 'gljournalentries',
    urlSuffix: '/journalentries',
    formFields: 1,
    listPermission: 'READ_JOURNALENTRY',
    downloadPermission: 'READ_CLIENT',
    description: 'Download journal entries template and upload Excel files'
  },
  {
    name: 'Guarantors',
    entityType: 'guarantors',
    urlSuffix: '/loans/1/guarantors',
    formFields: 1,
    listPermission: 'READ_GUARANTOR',
    downloadPermission: 'READ_CLIENT',
    description: 'Download guarantors template and upload guarantor Excel files'
  }
];

export function getBulkImportDefinition(name: string): BulkImportDefinition | undefined {
  const decoded = decodeURIComponent(name);
  return BULK_IMPORT_DEFINITIONS.find((entry) => entry.name === decoded);
}

/** User-facing label for bulk import types (API keys such as `Clients` stay unchanged). */
export function bulkImportDisplayName(name: string): string {
  return name === 'Clients' ? 'Customers' : name;
}
