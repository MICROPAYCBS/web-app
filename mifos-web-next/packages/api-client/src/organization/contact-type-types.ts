/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type ContactType = {
  id: number;
  typeCode: string;
  typeName: string;
  example?: string;
  validationRegex?: string;
  mandatory?: boolean;
  displayOrder?: number;
  status?: string;
};

export type ContactTypeTemplate = {
  statusOptions: string[];
};

export type ContactTypeMutationResponse = {
  resourceId?: number;
};

export type ClientContact = {
  id: number;
  clientId?: number;
  contactTypeId: number;
  contactTypeCode?: string;
  contactTypeName?: string;
  example?: string;
  validationRegex?: string;
  mandatory?: boolean;
  contactValue: string;
  primary?: boolean;
};

export type ClientContactTemplate = {
  contactTypeOptions: ContactType[];
};

export type ClientContactMutationResponse = {
  resourceId?: number;
};
