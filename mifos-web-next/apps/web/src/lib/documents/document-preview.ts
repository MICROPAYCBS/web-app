/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** MIME types accepted for customer / identity document uploads. */
export const DOCUMENT_UPLOAD_ACCEPT =
  'application/pdf,image/png,image/jpeg,image/jpg,image/webp';

export const DOCUMENT_UPLOAD_ACCEPT_LABEL = 'PDF or image (PNG, JPEG, WebP)';

const PREVIEWABLE_MIME_PREFIXES = ['image/'] as const;
const PREVIEWABLE_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif'
]);

const PREVIEWABLE_EXTENSIONS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif'
]);

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]);

const ALLOWED_UPLOAD_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp']);

export type DocumentPreviewKind = 'pdf' | 'image' | null;

export function fileExtension(fileName?: string | null): string | undefined {
  if (!fileName?.trim()) {
    return undefined;
  }
  const base = fileName.trim().split(/[/\\]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot < 0 || dot === base.length - 1) {
    return undefined;
  }
  return base.slice(dot + 1).toLowerCase();
}

export function isPreviewableDocument(options: {
  contentType?: string | null;
  fileName?: string | null;
}): boolean {
  return documentPreviewKind(options) != null;
}

/**
 * Whether to show a View action. Offers preview when the type is known previewable,
 * or when the type is unknown (missing extension) so the dialog can inspect Content-Type.
 * Hides View for known non-previewable extensions (e.g. .docx, .tiff).
 */
export function shouldOfferDocumentPreview(fileName?: string | null): boolean {
  if (documentPreviewKind({ fileName }) != null) {
    return true;
  }
  const ext = fileExtension(fileName);
  return ext == null;
}

export function documentPreviewKind(options: {
  contentType?: string | null;
  fileName?: string | null;
}): DocumentPreviewKind {
  const mime = options.contentType?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (mime === 'application/pdf') {
    return 'pdf';
  }
  if (PREVIEWABLE_MIME_TYPES.has(mime) || PREVIEWABLE_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
    if (mime.startsWith('image/')) {
      return 'image';
    }
  }

  const ext = fileExtension(options.fileName);
  if (ext === 'pdf') {
    return 'pdf';
  }
  if (ext && PREVIEWABLE_EXTENSIONS.has(ext) && ext !== 'pdf') {
    return 'image';
  }
  return null;
}

export function isAllowedDocumentUpload(file: {
  name: string;
  type?: string;
}): boolean {
  const mime = file.type?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (mime && ALLOWED_UPLOAD_MIME_TYPES.has(mime)) {
    return true;
  }
  const ext = fileExtension(file.name);
  return ext != null && ALLOWED_UPLOAD_EXTENSIONS.has(ext);
}

export const DOCUMENT_UPLOAD_REJECTED_MESSAGE =
  'Upload a PDF or image (PNG, JPEG, or WebP). Word and TIFF files are not supported.';

/**
 * Build Content-Disposition for BFF attachment proxy.
 * Default is attachment (download). Use disposition=inline for in-app preview.
 */
export function buildDocumentContentDisposition(options: {
  disposition: 'inline' | 'attachment';
  fileName?: string | null;
  upstreamDisposition?: string | null;
}): string {
  const filename =
    extractFilenameFromContentDisposition(options.upstreamDisposition) ??
    sanitizeFilename(options.fileName) ??
    'document';
  const encoded = encodeURIComponent(filename);
  return `${options.disposition}; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encoded}`;
}

export function parseDocumentDispositionParam(
  value: string | null
): 'inline' | 'attachment' {
  return value?.trim().toLowerCase() === 'inline' ? 'inline' : 'attachment';
}

function extractFilenameFromContentDisposition(
  header?: string | null
): string | undefined {
  if (!header) {
    return undefined;
  }
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const plain = /filename="([^"]+)"/i.exec(header) ?? /filename=([^;]+)/i.exec(header);
  return plain?.[1]?.trim().replace(/^"|"$/g, '') || undefined;
}

function sanitizeFilename(fileName?: string | null): string | undefined {
  if (!fileName?.trim()) {
    return undefined;
  }
  return fileName.trim().replace(/[/\\?%*:|"<>]/g, '_').slice(0, 180);
}

export function withDocumentDisposition(
  url: string,
  disposition: 'inline' | 'attachment'
): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}disposition=${disposition}`;
}
