/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type CustomerTitle = {
  id: number;
  titleCode: string;
  titleName: string;
  genderId?: number | null;
  displayOrder?: number;
  status?: string;
};

export type CustomerTitleTemplate = {
  genderOptions: Array<{ id: number; name: string }>;
  statusOptions: string[];
};

export type CustomerTitleMutationResponse = {
  resourceId?: number;
};
