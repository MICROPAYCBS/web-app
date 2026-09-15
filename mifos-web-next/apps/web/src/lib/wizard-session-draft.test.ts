/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  clearWizardSessionDraft,
  readWizardSessionDraft,
  wizardDraftsEqual,
  wizardSessionDraftKey,
  wizardSubmitRecoveryMessage,
  writeWizardSessionDraft,
  type WizardSessionSnapshot
} from './wizard-session-draft';

type MemoryStorage = {
  store: Map<string, string>;
  quota: number;
};

function installMemoryStorage(quota = Number.POSITIVE_INFINITY): MemoryStorage {
  const store = new Map<string, string>();
  const memory: MemoryStorage = { store, quota };
  const storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      if (value.length > memory.quota) {
        throw new Error('QuotaExceededError');
      }
      store.set(key, value);
    }
  } satisfies Storage;
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: storage
  });
  return memory;
}

const sampleSnapshot: WizardSessionSnapshot<{ name: string }> = {
  schemaVersion: 1,
  updatedAt: '2026-09-15T08:00:00.000Z',
  stepId: 'biodata',
  draft: { name: 'Ada' }
};

describe('wizard session draft storage', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'sessionStorage');
  });

  it('builds a stable key', () => {
    assert.equal(
      wizardSessionDraftKey(12, 'create-client', 'new'),
      'mifos.wizard-draft.v1:12:create-client:new'
    );
  });

  it('round-trips a snapshot', () => {
    installMemoryStorage();
    const key = wizardSessionDraftKey(1, 'create-client', 'new');
    assert.equal(writeWizardSessionDraft(key, sampleSnapshot), true);
    assert.deepEqual(readWizardSessionDraft(key, 1), sampleSnapshot);
  });

  it('discards a snapshot when the schema version does not match', () => {
    installMemoryStorage();
    const key = wizardSessionDraftKey(1, 'create-client', 'new');
    writeWizardSessionDraft(key, sampleSnapshot);
    assert.equal(readWizardSessionDraft(key, 2), null);
  });

  it('treats quota failures as a no-op', () => {
    installMemoryStorage(8);
    const key = wizardSessionDraftKey(1, 'create-client', 'new');
    assert.equal(writeWizardSessionDraft(key, sampleSnapshot), false);
    assert.equal(readWizardSessionDraft(key, 1), null);
  });

  it('clears a stored snapshot', () => {
    installMemoryStorage();
    const key = wizardSessionDraftKey(1, 'create-client', 'new');
    writeWizardSessionDraft(key, sampleSnapshot);
    clearWizardSessionDraft(key);
    assert.equal(readWizardSessionDraft(key, 1), null);
  });

  it('strips KYC captures before comparing session drafts', () => {
    const sanitize = (draft: {
      name: string;
      kycPhoto?: { previewUrl: string } | null;
    }) => ({
      name: draft.name
    });
    const withPhoto = { name: 'Ada', kycPhoto: { previewUrl: 'blob:1' } };
    const withoutPhoto = { name: 'Ada', kycPhoto: null };
    assert.equal(wizardDraftsEqual(sanitize(withPhoto), sanitize(withoutPhoto)), true);
  });
});

describe('wizardSubmitRecoveryMessage', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: true }
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator
    });
  });

  it('returns the original message while online', () => {
    assert.equal(wizardSubmitRecoveryMessage('Could not save.'), 'Could not save.');
  });

  it('adds a reconnect hint while offline', () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false }
    });
    assert.equal(
      wizardSubmitRecoveryMessage('Could not save.'),
      'Could not save. Your answers are still here. Reconnect, then try again.'
    );
  });
});
