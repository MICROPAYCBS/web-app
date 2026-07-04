'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CurrencyLegalTender } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { LegalTenderCreateUrlPanel } from '@/components/organization/legal-tender-create-url-panel';
import { LegalTenderEditUrlPanel } from '@/components/organization/legal-tender-edit-url-panel';
import { LegalTendersTable } from '@/components/organization/legal-tenders-table';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { LEGAL_TENDER_UNAVAILABLE_TITLE } from '@/lib/fineract/legal-tender-load';
import { LEGAL_TENDER_HUB_PATH, legalTenderCreatePath } from '@/lib/fineract/legal-tender-paths';
import { cn } from '@/lib/utils';

export function LegalTendersPageContent({
  currencyCode,
  decimalPlaces,
  legalTenders,
  loadError,
  loadErrorHint,
  loadErrorStatus,
  canCreate,
  canEdit,
  canDelete
}: {
  currencyCode: string;
  decimalPlaces: number;
  legalTenders: CurrencyLegalTender[];
  loadError?: string;
  loadErrorHint?: string;
  loadErrorStatus?: number;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const showActions = canCreate && !loadError;

  return (
    <>
      <ListPage
        title={`Legal tenders — ${currencyCode}`}
        description="Maintain note and coin denominations used when cashiers allocate or settle physical cash."
        backLink={<DetailBackLink href={LEGAL_TENDER_HUB_PATH} label="Back to currencies" />}
        actions={
          showActions ? (
            <Can permission="CREATE_LEGAL_TENDER">
              <Link href={legalTenderCreatePath(currencyCode)} className={cn(buttonVariants())}>
                Create legal tender
              </Link>
            </Can>
          ) : null
        }
      >
        {loadError ? (
          <LoadErrorAlert
            title={loadErrorStatus === 404 ? LEGAL_TENDER_UNAVAILABLE_TITLE : 'Could not load legal tenders'}
            message={loadError}
            hint={loadErrorHint}
          />
        ) : null}
        {!loadError ? (
          <LegalTendersTable
            currencyCode={currencyCode}
            decimalPlaces={decimalPlaces}
            legalTenders={legalTenders}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ) : null}
      </ListPage>

      {showActions ? (
        <Suspense fallback={null}>
          <LegalTenderCreateUrlPanel currencyCode={currencyCode} decimalPlaces={decimalPlaces} />
        </Suspense>
      ) : null}
      {canEdit && !loadError ? (
        <Suspense fallback={null}>
          <LegalTenderEditUrlPanel
            currencyCode={currencyCode}
            decimalPlaces={decimalPlaces}
            legalTenders={legalTenders}
          />
        </Suspense>
      ) : null}
    </>
  );
}
