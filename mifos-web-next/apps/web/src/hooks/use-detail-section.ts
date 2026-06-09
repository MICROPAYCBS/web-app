'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

const SECTION_PARAM = 'section';

export function useDetailSection(
  sectionIds: readonly string[],
  defaultSection: string
): { activeSection: string; setSection: (id: string) => void } {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSection = useMemo(() => {
    const raw = searchParams.get(SECTION_PARAM);
    if (raw && sectionIds.includes(raw)) {
      return raw;
    }
    return defaultSection;
  }, [defaultSection, searchParams, sectionIds]);

  const setSection = useCallback(
    (id: string) => {
      if (!sectionIds.includes(id)) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (id === defaultSection) {
        params.delete(SECTION_PARAM);
      } else {
        params.set(SECTION_PARAM, id);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [defaultSection, pathname, router, searchParams, sectionIds]
  );

  return { activeSection, setSection };
}
