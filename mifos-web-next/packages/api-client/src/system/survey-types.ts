/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractSurveyListItem {
  id: number;
  key: string;
  name: string;
  description?: string;
  countryCode: string;
  validFrom: string;
  validTo: string;
}

export interface FineractSurveyResponseData {
  id?: number;
  sequenceNo: number;
  text: string;
  value: number;
}

export interface FineractSurveyQuestionData {
  id?: number;
  key: string;
  sequenceNo: number;
  text: string;
  description?: string;
  responseDatas: FineractSurveyResponseData[];
}

export interface FineractSurveyDetail extends FineractSurveyListItem {
  questionDatas: FineractSurveyQuestionData[];
}

export interface FineractSurveyMutationResponse {
  resourceId?: number;
}
