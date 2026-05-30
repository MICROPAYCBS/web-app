/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ConnectRedirect } from '@/components/servers/connect-redirect';

/** Legacy URL — server management lives on `/login` (sheet). Proxy also redirects here. */
export default function ConnectPage() {
  return <ConnectRedirect />;
}
