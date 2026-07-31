import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  FineractHttpError,
  type FineractTwoFactorConfiguration,
  type FineractTwoFactorConfigurationUpdatePayload,
  type FineractTwoFactorConfigurationUpdateResponse,
  type OtpDeliveryMethod
} from '@mifos/api-client';
import type { UpdateTwoFactorConfigurationInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const CONFIGURE_PATH = '/twofactor/configure';

const DEFAULTS: FineractTwoFactorConfiguration = {
  otpDeliveryMethod: 'email',
  emailEnabled: false,
  emailSubject: 'Your verification code',
  emailBody: 'Hello {{username}}.\nYour verification code is {{token}}.',
  smsEnabled: false,
  smsProviderId: 1,
  smsText: 'Your verification code is {{token}}.',
  otpTokenLiveTime: 300,
  otpTokenLength: 5,
  accessTokenLiveTime: 86400,
  accessTokenLiveTimeExtended: 604800
};

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return fallback;
}

function asString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return fallback;
}

function asPositiveInt(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(number) && number > 0) {
    return Math.trunc(number);
  }
  return fallback;
}

function asOtpDeliveryMethod(value: unknown, fallback: OtpDeliveryMethod): OtpDeliveryMethod {
  if (value === 'email' || value === 'sms' || value === 'totp') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'email' || normalized === 'sms' || normalized === 'totp') {
      return normalized;
    }
  }
  return fallback;
}

function deriveDeliveryMethod(row: Record<string, unknown>): OtpDeliveryMethod {
  const explicit = asOtpDeliveryMethod(row['otp-delivery-method'], DEFAULTS.otpDeliveryMethod);
  if (row['otp-delivery-method'] != null) {
    return explicit;
  }
  const emailEnabled = asBoolean(row['otp-delivery-email-enable'], DEFAULTS.emailEnabled);
  const smsEnabled = asBoolean(row['otp-delivery-sms-enable'], DEFAULTS.smsEnabled);
  if (emailEnabled && !smsEnabled) {
    return 'email';
  }
  if (smsEnabled && !emailEnabled) {
    return 'sms';
  }
  return explicit;
}

export function normalizeTwoFactorConfiguration(raw: unknown): FineractTwoFactorConfiguration {
  const row =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const otpDeliveryMethod = deriveDeliveryMethod(row);
  const emailEnabled =
    otpDeliveryMethod === 'email'
      ? true
      : asBoolean(row['otp-delivery-email-enable'], DEFAULTS.emailEnabled);
  const smsEnabled =
    otpDeliveryMethod === 'sms'
      ? true
      : asBoolean(row['otp-delivery-sms-enable'], DEFAULTS.smsEnabled);

  return {
    otpDeliveryMethod,
    emailEnabled,
    emailSubject: asString(row['otp-delivery-email-subject'], DEFAULTS.emailSubject),
    emailBody: asString(row['otp-delivery-email-body'], DEFAULTS.emailBody),
    smsEnabled,
    smsProviderId: asPositiveInt(row['otp-delivery-sms-provider'], DEFAULTS.smsProviderId),
    smsText: asString(row['otp-delivery-sms-text'], DEFAULTS.smsText),
    otpTokenLiveTime: asPositiveInt(row['otp-token-live-time'], DEFAULTS.otpTokenLiveTime),
    otpTokenLength: asPositiveInt(row['otp-token-length'], DEFAULTS.otpTokenLength),
    accessTokenLiveTime: asPositiveInt(row['access-token-live-time'], DEFAULTS.accessTokenLiveTime),
    accessTokenLiveTimeExtended: asPositiveInt(
      row['access-token-live-time-extended'],
      DEFAULTS.accessTokenLiveTimeExtended
    )
  };
}

export function toTwoFactorConfigurationPayload(
  input: UpdateTwoFactorConfigurationInput
): FineractTwoFactorConfigurationUpdatePayload {
  const emailEnabled = input.otpDeliveryMethod === 'email';
  const smsEnabled = input.otpDeliveryMethod === 'sms';

  return {
    'otp-delivery-method': input.otpDeliveryMethod,
    'otp-delivery-email-enable': emailEnabled,
    'otp-delivery-email-subject': input.emailSubject,
    'otp-delivery-email-body': input.emailBody,
    'otp-delivery-sms-enable': smsEnabled,
    'otp-delivery-sms-provider': input.smsProviderId,
    'otp-delivery-sms-text': input.smsText,
    'otp-token-live-time': input.otpTokenLiveTime,
    'otp-token-length': input.otpTokenLength,
    'access-token-live-time': input.accessTokenLiveTime,
    'access-token-live-time-extended': input.accessTokenLiveTimeExtended
  };
}

export function isTwoFactorConfigurationUnavailable(error: unknown): boolean {
  if (!(error instanceof FineractHttpError)) {
    return false;
  }
  return error.status === 404 || error.status === 501;
}

export async function getTwoFactorConfiguration(): Promise<FineractTwoFactorConfiguration> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(CONFIGURE_PATH);
  return normalizeTwoFactorConfiguration(raw);
}

export async function updateTwoFactorConfiguration(
  input: UpdateTwoFactorConfigurationInput
): Promise<FineractTwoFactorConfigurationUpdateResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractTwoFactorConfigurationUpdateResponse>(
    CONFIGURE_PATH,
    toTwoFactorConfigurationPayload(input)
  );
}
