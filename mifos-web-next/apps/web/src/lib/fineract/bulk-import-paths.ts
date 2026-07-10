/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const BULK_IMPORT_LIST_PATH = '/organization/bulk-import';

export function bulkImportDetailPath(importName: string) {
  return `${BULK_IMPORT_LIST_PATH}/${encodeURIComponent(importName)}`;
}

/** Bulk import definition name for journal entries (organization/bulk-import). */
export const JOURNAL_ENTRIES_BULK_IMPORT_NAME = 'Journal Entries';

export const JOURNAL_ENTRIES_BULK_IMPORT_PATH = bulkImportDetailPath(
  JOURNAL_ENTRIES_BULK_IMPORT_NAME
);

export function bulkImportTemplateApiPath(importName: string) {
  return `/api/organization/bulk-import/template?importName=${encodeURIComponent(importName)}`;
}

export function bulkImportDocumentApiPath(importDocumentId: string | number) {
  return `/api/organization/bulk-import/documents/${importDocumentId}`;
}
