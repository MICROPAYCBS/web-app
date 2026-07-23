/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const JOB_SEQUENCES_LIST_PATH = '/system/job-sequences';

export function jobSequenceCreatePath(): string {
  return `${JOB_SEQUENCES_LIST_PATH}/create`;
}

export function jobSequenceDetailPath(sequenceId: string | number): string {
  return `${JOB_SEQUENCES_LIST_PATH}/${sequenceId}`;
}

export function jobSequenceEditPath(sequenceId: string | number): string {
  return `${jobSequenceDetailPath(sequenceId)}/edit`;
}

export function jobSequenceRunPath(
  sequenceId: string | number,
  runId: string | number
): string {
  return `${jobSequenceDetailPath(sequenceId)}/runs/${runId}`;
}
