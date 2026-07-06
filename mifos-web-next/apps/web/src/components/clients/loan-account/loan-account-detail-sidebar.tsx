'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  ArrowRightLeft,
  CalendarDays,
  Landmark,
  Receipt,
  Repeat,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { useMemo } from 'react';
import { DetailSectionNav } from '@/components/composites';
import { useDetailSection } from '@/hooks/use-detail-section';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  LOAN_ACCOUNT_DEFAULT_SECTION,
  LOAN_ACCOUNT_SECTIONS,
  loanAccountVisibleSections,
  type LoanAccountSectionId
} from '@/lib/fineract/loan-account-display';

export const LOAN_ACCOUNT_CASHIER_SECTION_ID = 'cashier';

const SECTION_ICONS: Record<LoanAccountSectionId, LucideIcon> = {
  summary: Landmark,
  schedule: CalendarDays,
  transactions: ArrowRightLeft,
  charges: Receipt,
  standingInstructions: Repeat
};

export function loanAccountSectionIds(
  account: FineractLoanAccountDetail,
  options?: { includeCashier?: boolean; standingInstructions?: boolean }
): string[] {
  const ids = loanAccountVisibleSections(account, {
    standingInstructions: options?.standingInstructions
  });
  return options?.includeCashier ? [...ids, LOAN_ACCOUNT_CASHIER_SECTION_ID] : ids;
}

export function LoanAccountDetailSidebar({
  account,
  includeCashier = false,
  standingInstructions = false
}: {
  account: FineractLoanAccountDetail;
  includeCashier?: boolean;
  standingInstructions?: boolean;
}) {
  const sectionIds = useMemo(
    () => loanAccountSectionIds(account, { includeCashier, standingInstructions }),
    [account, includeCashier, standingInstructions]
  );

  const navItems = useMemo(() => {
    const items: Array<{ id: string; label: string; icon: LucideIcon }> =
      LOAN_ACCOUNT_SECTIONS.filter((section) => sectionIds.includes(section.id)).map((section) => ({
        id: section.id,
        label: section.label,
        icon: SECTION_ICONS[section.id]
      }));
    if (includeCashier) {
      items.push({
        id: LOAN_ACCOUNT_CASHIER_SECTION_ID,
        label: 'My cashier',
        icon: Wallet
      });
    }
    return items;
  }, [includeCashier, sectionIds]);

  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    LOAN_ACCOUNT_DEFAULT_SECTION
  );

  if (navItems.length <= 1) {
    return null;
  }

  return (
    <DetailSectionNav
      items={navItems}
      activeId={activeSection}
      onSelect={(id) => setSection(id)}
    />
  );
}

export function useLoanAccountDetailSection(
  account: FineractLoanAccountDetail,
  options?: { includeCashier?: boolean; standingInstructions?: boolean }
) {
  const sectionIds = useMemo(
    () =>
      loanAccountSectionIds(account, {
        includeCashier: options?.includeCashier,
        standingInstructions: options?.standingInstructions
      }),
    [account, options?.includeCashier, options?.standingInstructions]
  );
  return useDetailSection(sectionIds, LOAN_ACCOUNT_DEFAULT_SECTION);
}
