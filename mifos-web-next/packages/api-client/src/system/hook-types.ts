/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type FineractHookTemplateName = 'Web' | 'SMS Bridge';

export interface FineractHookEvent {
  entityName: string;
  actionName: string;
}

export interface FineractHookConfigField {
  fieldName?: string;
  fieldValue?: string;
}

export interface FineractHookListItem {
  id: number;
  name: FineractHookTemplateName | string;
  displayName: string;
  isActive: boolean;
}

export interface FineractHookDetail extends FineractHookListItem {
  createdAt?: string | number[];
  updatedAt?: string | number[];
  templateId?: number;
  templateName?: string;
  events?: FineractHookEvent[];
  config?: FineractHookConfigField[];
}

export interface FineractHookTemplateOption {
  id?: number;
  name: FineractHookTemplateName | string;
}

export interface FineractHookGroupingEntity {
  name: string;
  actions: string[];
}

export interface FineractHookGrouping {
  name: string;
  entities: FineractHookGroupingEntity[];
}

export interface FineractHookTemplate {
  templates?: FineractHookTemplateOption[];
  groupings?: FineractHookGrouping[];
}

export interface FineractHookMutationResponse {
  resourceId?: number;
}
