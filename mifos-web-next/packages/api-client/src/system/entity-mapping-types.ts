/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractEntityMappingType {
  id: number;
  mappingTypes: string;
}

export interface FineractEntityMappingRow {
  mapId: number;
  fromEntity: string;
  toEntity: string;
  startDate?: string | number[];
  endDate?: string | number[];
}

export interface FineractEntityMappingDetail {
  mapId?: number;
  relId?: number;
  fromId?: number;
  toId?: number;
  startDate?: string | number[];
  endDate?: string | number[];
}

export interface EntityMappingOption {
  id: number;
  name: string;
}

export interface EntityMappingFilterOptions {
  fromLabel: string;
  toLabel: string;
  fromOptions: EntityMappingOption[];
  toOptions: EntityMappingOption[];
}
