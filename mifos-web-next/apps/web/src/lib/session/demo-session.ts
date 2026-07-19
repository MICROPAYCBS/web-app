/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Opt-in demo session for hosted previews (e.g. Vercel) before real login ships.
 * Set DEMO_SESSION_ENABLED=true and RBAC_DEV_SESSION in the deployment environment.
 */
export function isDemoSessionEnabled(): boolean {
  return process.env.DEMO_SESSION_ENABLED === 'true' && Boolean(process.env.RBAC_DEV_SESSION);
}
