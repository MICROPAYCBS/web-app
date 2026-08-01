/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDocumentContentDisposition,
  documentPreviewKind,
  isAllowedDocumentUpload,
  isPreviewableDocument,
  parseDocumentDispositionParam,
  shouldOfferDocumentPreview,
  withDocumentDisposition
} from './document-preview';

describe('document-preview', () => {
  it('detects previewable PDF and images from filename', () => {
    assert.equal(documentPreviewKind({ fileName: 'id.pdf' }), 'pdf');
    assert.equal(documentPreviewKind({ fileName: 'photo.JPEG' }), 'image');
    assert.equal(documentPreviewKind({ fileName: 'scan.webp' }), 'image');
    assert.equal(documentPreviewKind({ fileName: 'legacy.docx' }), null);
    assert.equal(documentPreviewKind({ fileName: 'scan.tiff' }), null);
  });

  it('offers preview for unknown extensions but not for Word/TIFF', () => {
    assert.equal(shouldOfferDocumentPreview('id.pdf'), true);
    assert.equal(shouldOfferDocumentPreview(undefined), true);
    assert.equal(shouldOfferDocumentPreview('legacy.docx'), false);
    assert.equal(shouldOfferDocumentPreview('scan.tiff'), false);
  });

  it('detects previewable types from content-type', () => {
    assert.equal(documentPreviewKind({ contentType: 'application/pdf' }), 'pdf');
    assert.equal(documentPreviewKind({ contentType: 'image/png; charset=binary' }), 'image');
    assert.equal(isPreviewableDocument({ contentType: 'application/msword' }), false);
  });

  it('allows only PDF and common images for upload', () => {
    assert.equal(isAllowedDocumentUpload({ name: 'a.pdf', type: 'application/pdf' }), true);
    assert.equal(isAllowedDocumentUpload({ name: 'a.png', type: 'image/png' }), true);
    assert.equal(isAllowedDocumentUpload({ name: 'a.docx', type: '' }), false);
    assert.equal(isAllowedDocumentUpload({ name: 'a.tif', type: 'image/tiff' }), false);
  });

  it('builds disposition headers and query helpers', () => {
    assert.equal(parseDocumentDispositionParam('inline'), 'inline');
    assert.equal(parseDocumentDispositionParam(null), 'attachment');
    assert.ok(
      buildDocumentContentDisposition({
        disposition: 'inline',
        fileName: 'National ID.pdf'
      }).startsWith('inline;')
    );
    assert.equal(
      withDocumentDisposition('/api/clients/1/documents/2/attachment', 'inline'),
      '/api/clients/1/documents/2/attachment?disposition=inline'
    );
  });
});
