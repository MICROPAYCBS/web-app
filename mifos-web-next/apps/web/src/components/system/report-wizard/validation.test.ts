/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultReportFormValues } from '@/lib/fineract/report-display';
import { reportDraftHasUnsavedChanges } from '@/components/system/report-wizard/validation';

describe('reportDraftHasUnsavedChanges', () => {
  const baseline = {
    form: defaultReportFormValues(),
    parameters: []
  };

  it('returns false when custom report draft is unchanged', () => {
    const draft = {
      form: { ...defaultReportFormValues(), reportName: 'Trial balance' },
      parameters: []
    };
    assert.equal(
      reportDraftHasUnsavedChanges(draft, { form: { ...draft.form }, parameters: [] }, {
        coreReport: false
      }),
      false
    );
  });

  it('returns true when a custom report field changes', () => {
    const draft = {
      form: { ...defaultReportFormValues(), reportName: 'Trial balance', description: 'Updated' },
      parameters: []
    };
    assert.equal(
      reportDraftHasUnsavedChanges(
        draft,
        { form: { ...draft.form, description: '' }, parameters: [] },
        { coreReport: false }
      ),
      true
    );
  });

  it('returns true when core report description changes', () => {
    const draft = {
      form: { ...defaultReportFormValues(), useReport: true, description: 'New text' },
      parameters: []
    };
    assert.equal(
      reportDraftHasUnsavedChanges(
        draft,
        { form: { ...draft.form, description: '' }, parameters: [] },
        { coreReport: true }
      ),
      true
    );
  });
});
