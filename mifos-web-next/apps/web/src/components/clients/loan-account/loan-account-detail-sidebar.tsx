'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  FileText,
  Landmark,
  Layers,
  NotebookPen,
  Receipt,
  Repeat,
  ScrollText,
  Shield,
  SlidersHorizontal,
  Users,
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
  originalSchedule: CalendarRange,
  transactions: ArrowRightLeft,
  charges: Receipt,
  overdueCharges: Receipt,
  collateral: Shield,
  guarantors: Users,
  tranches: Layers,
  termVariations: SlidersHorizontal,
  delinquency: AlertTriangle,
  reschedules: CalendarClock,
  documents: FileText,
  notes: NotebookPen,
  standingInstructions: Repeat,
  audit: ScrollText
};

export function loanAccountSectionIds(
  account: FineractLoanAccountDetail,
  options?: {
    includeCashier?: boolean;
    standingInstructions?: boolean;
    reschedules?: boolean;
    notes?: boolean;
    canCreateInterestPause?: boolean;
    canViewAudits?: boolean;
  }
): string[] {
  const ids = loanAccountVisibleSections(account, {
    standingInstructions: options?.standingInstructions,
    reschedules: options?.reschedules,
    notes: options?.notes,
    canCreateInterestPause: options?.canCreateInterestPause
  }).filter((id) => id !== 'audit' || options?.canViewAudits);
  return options?.includeCashier ? [...ids, LOAN_ACCOUNT_CASHIER_SECTION_ID] : ids;
}

export function LoanAccountDetailSidebar({
  account,
  includeCashier = false,
  standingInstructions = false,
  reschedules = false,
  notes = false,
  canCreateInterestPause = false,
  canViewAudits = false
}: {
  account: FineractLoanAccountDetail;
  includeCashier?: boolean;
  standingInstructions?: boolean;
  reschedules?: boolean;
  notes?: boolean;
  canCreateInterestPause?: boolean;
  canViewAudits?: boolean;
}) {
  const sectionIds = useMemo(
    () =>
      loanAccountSectionIds(account, {
        includeCashier,
        standingInstructions,
        reschedules,
        notes,
        canCreateInterestPause,
        canViewAudits
      }),
    [
      account,
      canCreateInterestPause,
      canViewAudits,
      includeCashier,
      notes,
      reschedules,
      standingInstructions
    ]
  );

  const navItems = useMemo(() => {
    const items: Array<{ id: string; label: string; icon: LucideIcon }> =
      LOAN_ACCOUNT_SECTIONS.filter(
        (section) => sectionIds.includes(section.id) && (section.id !== 'audit' || canViewAudits)
      ).map((section) => ({
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
  }, [canViewAudits, includeCashier, sectionIds]);

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
  options?: {
    includeCashier?: boolean;
    standingInstructions?: boolean;
    reschedules?: boolean;
    notes?: boolean;
    canCreateInterestPause?: boolean;
    canViewAudits?: boolean;
  }
) {
  const sectionIds = useMemo(
    () =>
      loanAccountSectionIds(account, {
        includeCashier: options?.includeCashier,
        standingInstructions: options?.standingInstructions,
        reschedules: options?.reschedules,
        notes: options?.notes,
        canCreateInterestPause: options?.canCreateInterestPause,
        canViewAudits: options?.canViewAudits
      }),
    [
      account,
      options?.canCreateInterestPause,
      options?.canViewAudits,
      options?.includeCashier,
      options?.notes,
      options?.reschedules,
      options?.standingInstructions
    ]
  );
  return useDetailSection(sectionIds, LOAN_ACCOUNT_DEFAULT_SECTION);
}
