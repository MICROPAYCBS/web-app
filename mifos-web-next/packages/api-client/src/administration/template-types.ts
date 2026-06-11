/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractTemplateOption {
  id: number;
  name: string;
}

export interface FineractTemplateMapper {
  id?: number;
  mappersorder: number;
  mapperskey: string;
  mappersvalue: string;
}

export interface FineractTemplateListItem {
  id: number;
  name: string;
  entity: string;
  type: string;
  entityId?: number;
  typeId?: number;
}

export interface FineractTemplateDetail extends FineractTemplateListItem {
  text: string;
  mappers: FineractTemplateMapper[];
}

export interface FineractTemplateFormTemplate {
  entities: FineractTemplateOption[];
  types: FineractTemplateOption[];
  template?: FineractTemplateDetail;
}

export interface FineractTemplateMutationResponse {
  resourceId: number;
}
