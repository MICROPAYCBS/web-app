'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { listDepartmentsForOfficeAction } from '@/actions/department';
import type { Department } from '@/lib/fineract/department-types';

/** Loads departments mapped to a branch for journal / posting pickers. */
export function useDepartmentsForOffice(officeId?: number | null) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = officeId != null && Number.isFinite(officeId) && officeId > 0 ? officeId : null;
    if (id == null) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void listDepartmentsForOfficeAction(id).then((result) => {
      if (cancelled) {
        return;
      }
      setDepartments(result.ok && result.data ? result.data : []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [officeId]);

  return { departments, loading };
}
