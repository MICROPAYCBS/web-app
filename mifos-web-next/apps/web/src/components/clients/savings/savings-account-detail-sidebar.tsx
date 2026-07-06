'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ArrowRightLeft, FileText, PiggyBank, Receipt, ScrollText, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { DetailSectionNav } from '@/components/composites';
import { useDetailSection } from '@/hooks/use-detail-section';
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
  audit: ScrollText
};

export function SavingsAccountDetailSidebar({ canViewAudits }: { canViewAudits: boolean }) {
  const sectionIds = useMemo(() => {
    const ids = SAVINGS_ACCOUNT_SECTIONS.map((section) => section.id);
    return ids.filter((id) => id !== 'audit' || canViewAudits);
  }, [canViewAudits]);

  const navItems = useMemo(
    () =>
      SAVINGS_ACCOUNT_SECTIONS.filter((section) => section.id !== 'audit' || canViewAudits).map(
        (section) => ({
          ...section,
          icon: SECTION_ICONS[section.id]
        })
      ),
    [canViewAudits]
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
