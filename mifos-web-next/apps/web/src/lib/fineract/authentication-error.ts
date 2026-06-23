/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code?: 'INVALID_CREDENTIALS' | 'TWO_FACTOR' | 'PASSWORD_EXPIRED' | 'SERVER'
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
