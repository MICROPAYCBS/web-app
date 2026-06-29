/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export function trimOptionalString(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function optionalStringsEqual(a: string | undefined, b: string | undefined): boolean {
  return trimOptionalString(a) === trimOptionalString(b);
}

export function optionalIdsEqual(a: number | undefined, b: number | undefined): boolean {
  return (a ?? null) === (b ?? null);
}

export function booleansEqual(a: boolean | undefined, b: boolean | undefined): boolean {
  return (a ?? false) === (b ?? false);
}

export class EmptyUpdatePayloadError extends Error {
  constructor(message = 'No changes to save.') {
    super(message);
    this.name = 'EmptyUpdatePayloadError';
  }
}
