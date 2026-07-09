/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const DEPARTMENT_LIST_PATH = '/accounting/departments';

export function departmentCreatePath(): string {
  return `${DEPARTMENT_LIST_PATH}?create=1`;
}

export function departmentEditPath(departmentId: string | number): string {
  return `${DEPARTMENT_LIST_PATH}?edit=${departmentId}`;
}
