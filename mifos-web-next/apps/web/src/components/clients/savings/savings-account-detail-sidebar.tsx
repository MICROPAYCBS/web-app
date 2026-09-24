'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ArrowRightLeft, BookOpen, FileText, PiggyBank, Receipt, ScrollText, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { DetailSectionNav } from '@/components/composites';
import { useDetailSection } from '@/hooks/use-detail-section';
import { isAccountPermissionedSectionVisible } from '@/lib/fineract/account-detail-section-visibility';
import {
  SAVINGS_ACCOUNT_DEFAULT_SECTION,
  SAVINGS_ACCOUNT_SECTIONS,
  type SavingsAccountSectionId
} from '@/lib/fineract/savings-account-display';

const SECTION_ICONS: Record<SavingsAccountSectionId, LucideIcon> = {
  summary: PiggyBank,
  transactions: ArrowRightLeft,
  statement: FileText,
  charges: Receipt,
  journalEntries: BookOpen,
  audit: ScrollText
};

export function SavingsAccountDetailSidebar({
  canViewAudits,
  canViewJournals
}: {
  canViewAudits: boolean;
  canViewJournals: boolean;
}) {
  const sectionIds = useMemo(() => {
    return SAVINGS_ACCOUNT_SECTIONS.map((section) => section.id).filter((id) =>
      isAccountPermissionedSectionVisible(id, { canViewAudits, canViewJournals })
    );
  }, [canViewAudits, canViewJournals]);

  const navItems = useMemo(
    () =>
      SAVINGS_ACCOUNT_SECTIONS.filter((section) =>
        isAccountPermissionedSectionVisible(section.id, { canViewAudits, canViewJournals })
      ).map((section) => ({
        ...section,
        icon: SECTION_ICONS[section.id]
      })),
    [canViewAudits, canViewJournals]
  );

  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    SAVINGS_ACCOUNT_DEFAULT_SECTION
  );

  return (
    <DetailSectionNav
      items={navItems}
      activeId={activeSection}
      onSelect={(id) => setSection(id)}
    />
  );
}
