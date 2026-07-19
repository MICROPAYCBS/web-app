'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BulkImportHistoryItem } from '@mifos/api-client';
import type { FineractCurrencyOption, FineractOfficeOption } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { useState } from 'react';
import { BulkJournalConstructWizard } from '@/components/accounting/journal-entries/bulk-construct/bulk-journal-construct-wizard';
import type { BulkConstructWizardProps } from '@/components/accounting/journal-entries/bulk-construct/types';
import { LegacyJournalEntriesImportPanel } from '@/components/accounting/journal-entries/bulk-operations/legacy-journal-entries-import-panel';
import { BulkImportDetailPageContent } from '@/components/organization/bulk-import-detail-page-content';
import { DetailBackLink } from '@/components/composites';
import { PageHeader } from '@/components/composites/page-header';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import type {
  LegacyImportLookupDepartment,
  LegacyImportLookupGlAccount,
  LegacyImportLookupOffice
} from '@/lib/accounting/legacy-journal-entries-import';
import {
  pageHeaderContentSpacing,
  platformInset,
  platformPageShell
} from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

export function BulkJournalOperationsHub({
  canConstruct,
  constructProps,
  importDefinition,
  importOffices,
  importHistory,
  canDownloadImport,
  legacyOffices,
  legacyDepartments,
  legacyGlAccounts,
  legacyCurrencies
}: {
  canConstruct: boolean;
  constructProps: BulkConstructWizardProps;
  importDefinition: BulkImportDefinition;
  importOffices: FineractOfficeOption[];
  importHistory: BulkImportHistoryItem[];
  canDownloadImport: boolean;
  legacyOffices: LegacyImportLookupOffice[];
  legacyDepartments: LegacyImportLookupDepartment[];
  legacyGlAccounts: LegacyImportLookupGlAccount[];
  legacyCurrencies: FineractCurrencyOption[];
}) {
  const [activeTab, setActiveTab] = useState('construct');

  return (
    <PlatformRouteLayout>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn(platformPageShell, 'min-h-0 flex-1')}
      >
        <PageHeader>
          <div className={pageHeaderContentSpacing}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <DetailBackLink href="/accounting/journal-entries" label="Back to journal entries" />
                <h1 className="text-2xl font-semibold tracking-tight">Bulk journal operations</h1>
                <p className="text-sm text-muted-foreground">
                  Construct similar journal entries for multiple branches or departments, import from
                  Excel, or bring in legacy journal entries.
                </p>
              </div>
              <div className="flex shrink-0 items-center self-start sm:self-center">
                <TabsList>
                  <TabsTrigger value="construct">Construct entries</TabsTrigger>
                  <TabsTrigger value="import">Import from Excel</TabsTrigger>
                  <TabsTrigger value="legacy-import">Import legacy entries</TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>
        </PageHeader>

        <TabsContent
          value="construct"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[hidden]:hidden"
        >
          {canConstruct ? (
            <BulkJournalConstructWizard {...constructProps} embedded />
          ) : (
            <div className={cn(platformInset, 'py-4')}>
              <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                You do not have permission to create journal entries. Switch to Import from Excel if
                you have access.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="import"
          className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain data-[hidden]:hidden"
        >
          <div className={cn(platformInset, 'space-y-4 py-4')}>
            <p className="text-sm text-muted-foreground">
              Download the Excel template, complete it offline, then upload.
            </p>
            <Can permission="READ_JOURNALENTRY">
              <BulkImportDetailPageContent
                definition={importDefinition}
                offices={importOffices}
                imports={importHistory}
                canDownload={canDownloadImport}
                embedded
              />
            </Can>
          </div>
        </TabsContent>

        <TabsContent
          value="legacy-import"
          className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain data-[hidden]:hidden"
        >
          <div className={cn(platformInset, 'space-y-4 py-4')}>
            <p className="text-sm text-muted-foreground">
              Download the legacy Excel template, complete it offline, then analyze the file to
              review matched branches, departments, and GL accounts before posting.
            </p>
            <Can permission="READ_JOURNALENTRY">
              <LegacyJournalEntriesImportPanel
                canDownload={canDownloadImport}
                canPost={canConstruct}
                offices={legacyOffices}
                departments={legacyDepartments}
                glAccounts={legacyGlAccounts}
                currencies={legacyCurrencies}
              />
            </Can>
          </div>
        </TabsContent>
      </Tabs>
    </PlatformRouteLayout>
  );
}
