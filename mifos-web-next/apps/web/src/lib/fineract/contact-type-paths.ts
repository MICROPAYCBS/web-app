/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



export const CONTACT_TYPE_LIST_PATH = '/organization/contact-types';



export function contactTypeCreatePath(): string {

  return `${CONTACT_TYPE_LIST_PATH}?create=1`;

}



export function contactTypeEditPath(contactTypeId: string | number): string {

  return `${CONTACT_TYPE_LIST_PATH}?edit=${contactTypeId}`;

}


