/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Tenant-global OTP delivery method (exactly one). */
export type OtpDeliveryMethod = 'email' | 'sms' | 'totp';

/** Normalized two-factor delivery and token settings from GET /twofactor/configure. */
export type FineractTwoFactorConfiguration = {
  otpDeliveryMethod: OtpDeliveryMethod;
  emailEnabled: boolean;
  emailSubject: string;
  emailBody: string;
  smsEnabled: boolean;
  smsProviderId: number;
  smsText: string;
  otpTokenLiveTime: number;
  otpTokenLength: number;
  accessTokenLiveTime: number;
  accessTokenLiveTimeExtended: number;
};

/** PUT /twofactor/configure body (Fineract kebab-case keys). */
export type FineractTwoFactorConfigurationUpdatePayload = {
  'otp-delivery-method'?: OtpDeliveryMethod;
  'otp-delivery-email-enable'?: boolean;
  'otp-delivery-email-subject'?: string;
  'otp-delivery-email-body'?: string;
  'otp-delivery-sms-enable'?: boolean;
  'otp-delivery-sms-provider'?: number;
  'otp-delivery-sms-text'?: string;
  'otp-token-live-time'?: number;
  'otp-token-length'?: number;
  'access-token-live-time'?: number;
  'access-token-live-time-extended'?: number;
};

export type FineractTwoFactorConfigurationUpdateResponse = {
  resourceId?: number;
  changes?: Record<string, unknown>;
};
