/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const WIZARD_SESSION_DRAFT_PREFIX = 'mifos.wizard-draft.v1';

export type WizardSessionSnapshot<T> = {
  schemaVersion: number;
  updatedAt: string;
  stepId: string;
  draft: T;
};

export function wizardSessionDraftKey(
  userId: number | string,
  wizardId: string,
  entityKey: string
): string {
  return `${WIZARD_SESSION_DRAFT_PREFIX}:${userId}:${wizardId}:${entityKey}`;
}

export function wizardDraftsEqual<T>(left: T, right: T): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getSessionStorage(): Storage | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  return sessionStorage;
}

function isSnapshot<T>(value: unknown, schemaVersion: number): value is WizardSessionSnapshot<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const row = value as Partial<WizardSessionSnapshot<T>>;
  return (
    row.schemaVersion === schemaVersion &&
    typeof row.updatedAt === 'string' &&
    typeof row.stepId === 'string' &&
    'draft' in row
  );
}

export function readWizardSessionDraft<T>(
  key: string,
  schemaVersion: number
): WizardSessionSnapshot<T> | null {
  try {
    const raw = getSessionStorage()?.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isSnapshot<T>(parsed, schemaVersion)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeWizardSessionDraft<T>(
  key: string,
  snapshot: WizardSessionSnapshot<T>
): boolean {
  try {
    getSessionStorage()?.setItem(key, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function clearWizardSessionDraft(key: string): void {
  try {
    getSessionStorage()?.removeItem(key);
  } catch {
    // sessionStorage may be unavailable
  }
}

export function wizardSubmitRecoveryMessage(message: string): string {
  const online = typeof navigator === 'undefined' || navigator.onLine;
  if (online) {
    return message;
  }
  return `${message} Your answers are still here. Reconnect, then try again.`;
}
