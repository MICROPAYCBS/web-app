/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractEnumOption {
  id: number;
  name?: string;
  code?: string;
  value?: string;
  active?: boolean;
  mandatory?: boolean;
}

export interface FineractOfficeOption {
  id: number;
  name: string;
  nameDecorated?: string;
}

export interface FineractClientTemplate {
  officeOptions: FineractOfficeOption[];
  staffOptions?: FineractEnumOption[];
  clientLegalFormOptions?: FineractEnumOption[];
  dateFormat?: string;
  locale?: string;
}

export interface FineractClientSummary {
  id: number;
  accountNo: string;
  externalId?: string;
  status: FineractEnumOption;
  active: boolean;
  displayName?: string;
  firstname?: string;
  lastname?: string;
  officeName?: string;
  staffName?: string;
}

export interface FineractClientsPage {
  totalFilteredRecords: number;
  pageItems: FineractClientSummary[];
}

export interface FineractClientDetail extends FineractClientSummary {
  middlename?: string;
  fullname?: string;
  mobileNo?: string;
  emailAddress?: string;
  dateOfBirth?: number[];
  timeline?: {
    submittedOnDate?: number[];
    activatedOnDate?: number[];
  };
  clientType?: FineractEnumOption;
  clientClassification?: FineractEnumOption;
  gender?: FineractEnumOption;
  officeId?: number;
  staffId?: number;
}

export interface FineractCreateClientResponse {
  officeId: number;
  clientId: number;
  resourceId: number;
  resourceExternalId?: string;
}
