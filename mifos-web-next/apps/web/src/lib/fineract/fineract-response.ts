import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AuthenticationError } from '@/lib/fineract/authentication-error';

const MAX_EXCERPT_CHARS = 2_000;

export type FineractResponseContext = {
  requestUrl?: string;
  operation?: string;
};

function looksLikeHtmlDocument(text: string): boolean {
  const trimmed = text.trimStart().slice(0, 64).toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function extractPageTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1]?.replace(/\s+/g, ' ').trim();
  return title || undefined;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateExcerpt(value: string, maxLength = MAX_EXCERPT_CHARS): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}… [truncated ${value.length - maxLength} chars]`;
}

/** Human-readable excerpt from an HTML error page for login troubleshooting. */
export function formatHtmlPageExcerpt(html: string): string {
  const title = extractPageTitle(html);
  const text = stripHtmlToText(html);
  const lines: string[] = [];

  if (title) {
    lines.push(`Page title: ${title}`);
  }

  if (text) {
    lines.push(`Page text: ${truncateExcerpt(text)}`);
  } else {
    lines.push(`Raw HTML: ${truncateExcerpt(html.replace(/\s+/g, ' ').trim())}`);
  }

  return lines.join('\n');
}

function formatPlainTextExcerpt(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return truncateExcerpt(normalized || '(empty body)');
}

function buildUnexpectedResponseMessage(
  res: Response,
  body: string,
  kind: 'html' | 'invalid-json',
  context?: FineractResponseContext
): string {
  const lines: string[] = [];

  if (kind === 'html') {
    lines.push('The server returned a web page instead of a Fineract API JSON response.');
  } else {
    lines.push('The server returned a body that is not valid JSON.');
  }

  if (context?.operation) {
    lines.push(`Operation: ${context.operation}`);
  }
  if (context?.requestUrl) {
    lines.push(`Request URL: ${context.requestUrl}`);
  }

  const statusLine = [`HTTP ${res.status}`, res.statusText].filter(Boolean).join(' ');
  lines.push(statusLine);

  lines.push('');
  lines.push('--- Response body ---');
  lines.push(kind === 'html' ? formatHtmlPageExcerpt(body) : formatPlainTextExcerpt(body));

  return lines.join('\n');
}

/**
 * Parse a Fineract JSON body or raise a user-facing auth error that includes response content.
 */
export async function readFineractJsonBody<T>(
  res: Response,
  context?: FineractResponseContext
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new AuthenticationError(
      buildUnexpectedResponseMessage(res, '', 'invalid-json', context),
      'SERVER'
    );
  }
  if (looksLikeHtmlDocument(text)) {
    throw new AuthenticationError(
      buildUnexpectedResponseMessage(res, text, 'html', context),
      'SERVER'
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AuthenticationError(
      buildUnexpectedResponseMessage(res, text, 'invalid-json', context),
      'SERVER'
    );
  }
}
