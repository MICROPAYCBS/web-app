/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';

/** Legacy frequent postings route — journal entry create is a single manual form. */
export default async function FrequentPostingsPage() {
  return redirect('/accounting/journal-entries/create');
}
