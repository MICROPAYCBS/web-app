/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractExternalServiceName,
  FineractExternalServiceProperty
} from '@mifos/api-client';

/** Server-safe external service metadata (no client icon imports). */
export type ExternalServiceSlug = 'amazon-s3' | 'email' | 'sms' | 'notification';

export const DEFAULT_EXTERNAL_SERVICE_SLUG: ExternalServiceSlug = 'amazon-s3';

export const EXTERNAL_SERVICE_SLUGS: readonly ExternalServiceSlug[] = [
  'amazon-s3',
  'email',
  'sms',
  'notification'
] as const;

const slugToApiName: Record<ExternalServiceSlug, FineractExternalServiceName> = {
  'amazon-s3': 'S3',
  email: 'SMTP',
  sms: 'SMS',
  notification: 'NOTIFICATION'
};

export function isExternalServiceSlug(value: string): value is ExternalServiceSlug {
  return (EXTERNAL_SERVICE_SLUGS as readonly string[]).includes(value);
}

export function externalServiceApiName(slug: ExternalServiceSlug): FineractExternalServiceName {
  return slugToApiName[slug];
}

export function externalServiceListPath(): string {
  return '/system/external-services';
}

export function externalServiceSectionHref(slug: ExternalServiceSlug): string {
  const base = externalServiceListPath();
  if (slug === DEFAULT_EXTERNAL_SERVICE_SLUG) {
    return base;
  }
  return `${base}?section=${slug}`;
}

export function configurationsBySlug(
  configurations: Record<FineractExternalServiceName, FineractExternalServiceProperty[]>
): Record<ExternalServiceSlug, FineractExternalServiceProperty[]> {
  const bySlug = {} as Record<ExternalServiceSlug, FineractExternalServiceProperty[]>;
  for (const slug of EXTERNAL_SERVICE_SLUGS) {
    bySlug[slug] = configurations[slugToApiName[slug]] ?? [];
  }
  return bySlug;
}
