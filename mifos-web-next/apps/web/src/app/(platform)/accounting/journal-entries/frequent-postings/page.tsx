/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';

/** Frequent postings are now part of the unified journal entry create form. */
export default async function FrequentPostingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rule = typeof params.rule === 'string' ? params.rule.trim() : '';
  return redirect(
    rule
      ? `/accounting/journal-entries/create?rule=${encodeURIComponent(rule)}`
      : '/accounting/journal-entries/create'
  );
}
