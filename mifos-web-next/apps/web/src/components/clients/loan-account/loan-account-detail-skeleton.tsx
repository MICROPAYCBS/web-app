/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailPage } from '@/components/composites';
import { Skeleton } from '@/components/ui/skeleton';
import { LOAN_ACCOUNT_SECTIONS } from '@/lib/fineract/loan-account-display';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { loanAccountSectionIds } from '@/components/clients/loan-account/loan-account-detail-sidebar';
import { cn } from '@/lib/utils';

export function LoanAccountSectionNavSkeleton({
  account
}: {
  account?: FineractLoanAccountDetail;
}) {
  const sections = account
    ? LOAN_ACCOUNT_SECTIONS.filter((section) =>
        loanAccountSectionIds(account, { includeCashier: false }).includes(section.id)
      )
    : LOAN_ACCOUNT_SECTIONS;

  return (
    <nav className="flex flex-col" aria-hidden>
      <ul className="flex flex-col gap-0.5">
        {sections.map((section) => (
          <li key={section.id} className="flex items-center gap-2 rounded-md px-3 py-2">
            <Skeleton className="size-4 shrink-0 rounded-sm" />
            <Skeleton className="h-4 w-28" />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LoanAccountHeaderSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

function DetailSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="overflow-visible rounded-xl border border-border shadow-none">
          <div className="space-y-1 p-4 pt-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSectionCardSkeleton({ fieldCount = 6 }: { fieldCount?: number }) {
  return (
    <div className="overflow-visible rounded-xl border border-border shadow-none" aria-hidden>
      <div className="flex flex-col gap-1.5 border-b border-border p-6 pb-4">
        <Skeleton className="h-5 w-44" />
      </div>
      <div className="p-6 pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: fieldCount }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton
                className={cn(
                  'h-4 w-full max-w-[14rem]',
                  index % 3 === 1 && 'max-w-[10rem]',
                  index % 3 === 2 && 'max-w-[12rem]'
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoanAccountSummarySkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading loan account">
      <DetailSummarySkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSectionCardSkeleton fieldCount={10} />
        <DetailSectionCardSkeleton fieldCount={4} />
      </div>
    </div>
  );
}

export function LoanAccountShellSkeleton() {
  return (
    <DetailPage
      header={<LoanAccountHeaderSkeleton />}
      sidebar={<LoanAccountSectionNavSkeleton />}
    >
      <LoanAccountSummarySkeleton />
    </DetailPage>
  );
}
