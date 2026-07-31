/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OtpDeliveryMethod } from '../system/twofactor-configuration-types';

/** Subset of POST /authentication when 2FA is required. */
export type FineractAuthenticationTwoFactorContext = {
  deliveryMethod?: OtpDeliveryMethod;
  totpEnabled?: boolean;
  totpEnrollmentRequired?: boolean;
};

export type FineractTwoFactorDeliveryMethodOption = {
  name: string;
  target?: string;
};

export type FineractTotpEnrollResponse = {
  secret: string;
  otpauthUri: string;
};

export type FineractTotpConfirmResponse = {
  totpEnabled: boolean;
};
