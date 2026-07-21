'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Coins, Receipt, ScrollText, Share2, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { DetailSectionNav } from '@/components/composites';
import { useDetailSection } from '@/hooks/use-detail-section';
import {
  SHARE_ACCOUNT_DEFAULT_SECTION,
  SHARE_ACCOUNT_SECTIONS,
  type ShareAccountSectionId
} from '@/lib/fineract/share-account-display';

const SECTION_ICONS: Record<ShareAccountSectionId, LucideIcon> = {
  summary: Share2,
  purchases: Coins,
  charges: Receipt,
  dividends: Coins,
  audit: ScrollText
};

export function ShareAccountDetailSidebar({ canViewAudits }: { canViewAudits: boolean }) {
  const sectionIds = useMemo(() => {
    const ids = SHARE_ACCOUNT_SECTIONS.map((section) => section.id);
    return ids.filter((id) => id !== 'audit' || canViewAudits);
  }, [canViewAudits]);

  const navItems = useMemo(
    () =>
      SHARE_ACCOUNT_SECTIONS.filter((section) => section.id !== 'audit' || canViewAudits).map(
        (section) => ({
          ...section,
          icon: SECTION_ICONS[section.id]
        })
      ),
    [canViewAudits]
  );

  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    SHARE_ACCOUNT_DEFAULT_SECTION
  );

  return (
    <DetailSectionNav
      items={navItems}
      activeId={activeSection}
      onSelect={(id) => setSection(id)}
    />
  );
}
