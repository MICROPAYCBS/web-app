'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  clearWizardSessionDraft,
  readWizardSessionDraft,
  wizardSessionDraftKey,
  writeWizardSessionDraft,
  type WizardSessionSnapshot
} from '@/lib/wizard-session-draft';

export function useWizardSessionDraft<T>({
  userId,
  wizardId,
  entityKey,
  schemaVersion,
  draft,
  stepId,
  sanitize,
  isDirty,
  enabled = true,
  debounceMs = 500
}: {
  userId: number | null | undefined;
  wizardId: string;
  entityKey: string;
  schemaVersion: number;
  draft: T;
  stepId: string;
  sanitize?: (draft: T) => T;
  isDirty: (sanitizedDraft: T) => boolean;
  enabled?: boolean;
  debounceMs?: number;
}): {
  pendingSnapshot: WizardSessionSnapshot<T> | null;
  resume: () => WizardSessionSnapshot<T> | null;
  discard: () => void;
  clear: () => void;
} {
  const [pendingSnapshot, setPendingSnapshot] = useState<WizardSessionSnapshot<T> | null>(null);
  const [status, setStatus] = useState<'booting' | 'pending' | 'active'>('booting');

  const storageKey =
    enabled && userId != null ? wizardSessionDraftKey(userId, wizardId, entityKey) : null;

  useEffect(() => {
    if (!storageKey) {
      setPendingSnapshot(null);
      setStatus('active');
      return;
    }
    const snapshot = readWizardSessionDraft<T>(storageKey, schemaVersion);
    if (snapshot) {
      setPendingSnapshot(snapshot);
      setStatus('pending');
      return;
    }
    setPendingSnapshot(null);
    setStatus('active');
  }, [schemaVersion, storageKey]);

  const resume = useCallback((): WizardSessionSnapshot<T> | null => {
    const snapshot = pendingSnapshot;
    setPendingSnapshot(null);
    setStatus('active');
    return snapshot;
  }, [pendingSnapshot]);

  const discard = useCallback(() => {
    if (storageKey) {
      clearWizardSessionDraft(storageKey);
    }
    setPendingSnapshot(null);
    setStatus('active');
  }, [storageKey]);

  const clear = useCallback(() => {
    if (storageKey) {
      clearWizardSessionDraft(storageKey);
    }
    setPendingSnapshot(null);
    setStatus('active');
  }, [storageKey]);

  useEffect(() => {
    if (status !== 'pending') {
      return;
    }
    const sanitized = sanitize ? sanitize(draft) : draft;
    if (isDirty(sanitized)) {
      setPendingSnapshot(null);
      setStatus('active');
    }
  }, [draft, isDirty, sanitize, status]);

  useEffect(() => {
    if (status !== 'active' || !storageKey) {
      return;
    }
    const sanitized = sanitize ? sanitize(draft) : draft;
    const timeoutId = window.setTimeout(() => {
      if (!isDirty(sanitized)) {
        clearWizardSessionDraft(storageKey);
        return;
      }
      writeWizardSessionDraft(storageKey, {
        schemaVersion,
        updatedAt: new Date().toISOString(),
        stepId,
        draft: sanitized
      });
    }, debounceMs);
    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, draft, isDirty, sanitize, schemaVersion, status, stepId, storageKey]);

  return {
    pendingSnapshot: status === 'pending' ? pendingSnapshot : null,
    resume,
    discard,
    clear
  };
}
