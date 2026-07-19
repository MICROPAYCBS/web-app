/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type IdentityTypeCodeValueOption = {
  id: number;
  name: string;
  position?: number;
  active?: boolean;
};

export type IdentityType = {
  id: number;
  codeValueId: number;
  codeValueName: string;
  example?: string;
  formatDescription?: string;
  validationMessage?: string;
  validationRegex?: string;
  displayOrder?: number;
  status?: string;
};

export type IdentityTypeTemplate = {
  codeValueOptions: IdentityTypeCodeValueOption[];
  statusOptions: string[];
};

export type IdentityTypeMutationResponse = {
  resourceId?: number;
};

/** Active identity type rules returned on client identifier templates. */
export type ClientIdentifierIdentityTypeOption = Pick<
  IdentityType,
  | 'id'
  | 'codeValueId'
  | 'codeValueName'
  | 'example'
  | 'formatDescription'
  | 'validationMessage'
  | 'validationRegex'
  | 'status'
>;
