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
import type { LucideIcon } from 'lucide-react';
import { Bell, Cloud, Mail, MessageSquare } from 'lucide-react';

export type ExternalServiceSlug = 'amazon-s3' | 'email' | 'sms' | 'notification';

export interface ExternalServiceFieldDefinition {
  key: string;
  label: string;
  secret?: boolean;
  type?: 'text' | 'password' | 'email' | 'boolean';
}

export interface ExternalServiceDefinition {
  slug: ExternalServiceSlug;
  apiName: FineractExternalServiceName;
  title: string;
  description: string;
  icon: LucideIcon;
  fields: ExternalServiceFieldDefinition[];
}

export const DEFAULT_EXTERNAL_SERVICE_SLUG: ExternalServiceSlug = 'amazon-s3';

export const EXTERNAL_SERVICE_DEFINITIONS: ExternalServiceDefinition[] = [
  {
    slug: 'amazon-s3',
    apiName: 'S3',
    title: 'Amazon S3',
    description: 'Object storage for documents and images.',
    icon: Cloud,
    fields: [
      { key: 's3_access_key', label: 'Access key', secret: true, type: 'password' },
      { key: 's3_bucket_name', label: 'Bucket name' },
      { key: 's3_secret_key', label: 'Secret key', secret: true, type: 'password' }
    ]
  },
  {
    slug: 'email',
    apiName: 'SMTP',
    title: 'Email (SMTP)',
    description: 'Outbound email delivery settings.',
    icon: Mail,
    fields: [
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password', secret: true, type: 'password' },
      { key: 'host', label: 'Host' },
      { key: 'port', label: 'Port' },
      { key: 'useTLS', label: 'Use TLS', type: 'boolean' },
      { key: 'fromEmail', label: 'From email', type: 'email' },
      { key: 'fromName', label: 'From name' }
    ]
  },
  {
    slug: 'sms',
    apiName: 'SMS',
    title: 'SMS',
    description: 'SMS gateway connection settings.',
    icon: MessageSquare,
    fields: [
      { key: 'host_name', label: 'Host name' },
      { key: 'port_number', label: 'Port number' },
      { key: 'end_point', label: 'End point' },
      { key: 'tenant_app_key', label: 'Tenant app key' }
    ]
  },
  {
    slug: 'notification',
    apiName: 'NOTIFICATION',
    title: 'Push notifications',
    description: 'Mobile push notification provider settings.',
    icon: Bell,
    fields: [
      { key: 'server_key', label: 'Server key', secret: true, type: 'password' },
      { key: 'gcm_end_point', label: 'GCM end point' },
      { key: 'fcm_end_point', label: 'FCM end point' }
    ]
  }
];

const slugByApiName = new Map(
  EXTERNAL_SERVICE_DEFINITIONS.map((definition) => [definition.apiName, definition.slug])
);

export function isExternalServiceSlug(value: string): value is ExternalServiceSlug {
  return EXTERNAL_SERVICE_DEFINITIONS.some((definition) => definition.slug === value);
}

export function getExternalServiceDefinition(
  slug: ExternalServiceSlug
): ExternalServiceDefinition {
  const definition = EXTERNAL_SERVICE_DEFINITIONS.find((item) => item.slug === slug);
  if (!definition) {
    throw new Error(`Unknown external service slug: ${slug}`);
  }
  return definition;
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

/** @deprecated Use {@link externalServiceSectionHref} — nested routes redirect to section query. */
export function externalServicePath(slug: ExternalServiceSlug): string {
  return externalServiceSectionHref(slug);
}

export function configurationsBySlug(
  configurations: Record<FineractExternalServiceName, FineractExternalServiceProperty[]>
): Record<ExternalServiceSlug, FineractExternalServiceProperty[]> {
  const bySlug = {} as Record<ExternalServiceSlug, FineractExternalServiceProperty[]>;
  for (const definition of EXTERNAL_SERVICE_DEFINITIONS) {
    bySlug[definition.slug] = configurations[definition.apiName] ?? [];
  }
  return bySlug;
}

export function externalServicePropertyLabel(
  definition: ExternalServiceDefinition,
  propertyName: string
): string {
  return definition.fields.find((field) => field.key === propertyName)?.label ?? propertyName;
}

export function isSecretExternalServiceProperty(
  definition: ExternalServiceDefinition,
  propertyName: string
): boolean {
  return definition.fields.find((field) => field.key === propertyName)?.secret === true;
}

export function maskSecretValue(value: string): string {
  if (!value) {
    return '—';
  }
  if (value.length <= 4) {
    return '••••';
  }
  return `${value.slice(0, 2)}${'•'.repeat(Math.min(value.length - 4, 12))}${value.slice(-2)}`;
}

export function formatExternalServicePropertyValue(
  definition: ExternalServiceDefinition,
  property: FineractExternalServiceProperty
): string {
  if (property.name === 'useTLS') {
    return property.value === 'true' ? 'Yes' : 'No';
  }
  if (isSecretExternalServiceProperty(definition, property.name)) {
    return maskSecretValue(property.value);
  }
  return property.value || '—';
}

export function propertiesToFormValues(
  definition: ExternalServiceDefinition,
  properties: FineractExternalServiceProperty[]
): Record<string, string | boolean> {
  const byName = new Map(properties.map((property) => [property.name, property.value]));
  const values: Record<string, string | boolean> = {};

  for (const field of definition.fields) {
    const raw = byName.get(field.key) ?? '';
    if (field.type === 'boolean') {
      values[field.key] = raw === 'true';
    } else {
      values[field.key] = raw;
    }
  }

  return values;
}

export function orderedExternalServiceProperties(
  definition: ExternalServiceDefinition,
  properties: FineractExternalServiceProperty[]
): FineractExternalServiceProperty[] {
  const byName = new Map(properties.map((property) => [property.name, property]));
  return definition.fields
    .map((field) => byName.get(field.key))
    .filter((property): property is FineractExternalServiceProperty => property != null);
}

export function externalServiceSlugFromApiName(
  apiName: FineractExternalServiceName
): ExternalServiceSlug {
  const slug = slugByApiName.get(apiName);
  if (!slug) {
    throw new Error(`Unknown external service API name: ${apiName}`);
  }
  return slug;
}
