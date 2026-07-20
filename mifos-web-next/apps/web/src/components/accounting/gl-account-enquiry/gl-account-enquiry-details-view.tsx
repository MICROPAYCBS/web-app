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
  FineractGlAccountDetail,
  FineractGlAccountEditData,
  FineractOfficeOption
} from '@mifos/api-client';
import { GlAccountEnquiryDetailsPanel } from '@/components/accounting/gl-account-enquiry/gl-account-enquiry-details-panel';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { formatGlAccountTypeLabel } from '@/lib/accounting/gl-account-display';
import type { GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import type { Department } from '@/lib/fineract/departments';
import {
  GL_ACCOUNT_ENQUIRY_LIST_PATH,
  type GlAccountEnquiryLine,
  type GlAccountEnquiryListQuery
} from '@/lib/fineract/gl-account-enquiry-query';

function resolveOfficeName(
  offices: FineractOfficeOption[],
  officeId: string | undefined
): string | null {
  const id = officeId?.trim();
  if (!id) {
    return null;
  }
  const office = offices.find((item) => String(item.id) === id);
  const name = office?.name?.trim() || office?.nameDecorated?.trim();
  return name || null;
}

function resolveDepartmentName(
  departments: Department[],
  departmentId: string | undefined
): string | null {
  const id = departmentId?.trim();
  if (!id || id === '0') {
    return null;
  }
  const department = departments.find((item) => String(item.id) === id);
  const name = department?.departmentName?.trim();
  return name || null;
}

function buildEnquiryDetailsHeaderMeta(
  account: FineractGlAccountEditData,
  query: GlAccountEnquiryListQuery,
  offices: FineractOfficeOption[],
  departments: Department[]
): string {
  const parts = [account.glCode, formatGlAccountTypeLabel(account.type)];
  const branchName = resolveOfficeName(offices, query.officeId);
  const departmentName = resolveDepartmentName(departments, query.departmentId);
  if (branchName) {
    parts.push(branchName);
  }
  if (departmentName) {
    parts.push(departmentName);
  }
  return parts.join(' · ');
}

export function GlAccountEnquiryDetailsView({
  account,
  returnTo = null,
  query,
  lines,
  summary,
  historyGlAccount,
  loadError,
  offices,
  departments,
  currencies
}: {
  account: FineractGlAccountEditData;
  returnTo?: string | null;
  query: GlAccountEnquiryListQuery;
  lines: GlAccountEnquiryLine[];
  summary: GlAccountEnquirySummary | null;
  historyGlAccount: FineractGlAccountDetail | null;
  loadError?: string | null;
  offices: FineractOfficeOption[];
  departments: Department[];
  currencies: FineractCurrencyOption[];
}) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={returnTo ?? GL_ACCOUNT_ENQUIRY_LIST_PATH}
              label="Back to GL account enquiry"
            />
          }
          title={account.name}
          meta={buildEnquiryDetailsHeaderMeta(account, query, offices, departments)}
          status={
            account.disabled
              ? { label: 'Disabled', variant: 'secondary' }
              : { label: 'Enabled', variant: 'default' }
          }
        />
      }
    >
      <GlAccountEnquiryDetailsPanel
        glAccountId={account.id}
        lines={lines}
        query={query}
        summary={summary}
        glAccount={historyGlAccount ?? account}
        loadError={loadError}
        returnTo={returnTo}
        offices={offices}
        departments={departments}
        currencies={currencies}
      />
    </DetailPage>
  );
}
