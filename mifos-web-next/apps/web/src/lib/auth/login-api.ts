/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** `Accept` value for interactive login via `fetch` (see `/api/auth/login`). */
export const LOGIN_JSON_ACCEPT = 'application/json';

export type LoginApiSuccess = { ok: true; redirectTo: string };
export type LoginApiFailure = { ok: false; message: string };
export type LoginApiResponse = LoginApiSuccess | LoginApiFailure;
