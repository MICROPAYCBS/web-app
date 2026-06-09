/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSurveyDetail } from '@mifos/api-client';
import type { SurveyQuestionInput, UpsertSurveyFormInput } from '@mifos/validation';

/** Whether a survey is within its valid date range (legacy parity). */
export function isSurveyActive(validFrom: string, validTo: string, today = new Date()): boolean {
  const curdate = today.toISOString().split('T')[0];
  return curdate >= validFrom && curdate <= validTo;
}

export function defaultSurveyQuestion(): SurveyQuestionInput {
  return {
    key: '',
    text: '',
    description: '',
    responseDatas: [{ text: '', value: '' }]
  };
}

export function defaultSurveyFormValues(): UpsertSurveyFormInput {
  return {
    key: '',
    name: '',
    countryCode: '',
    description: '',
    questionDatas: [defaultSurveyQuestion()]
  };
}

export function surveyToFormValues(survey: FineractSurveyDetail): UpsertSurveyFormInput {
  return {
    key: survey.key,
    name: survey.name,
    countryCode: survey.countryCode,
    description: survey.description ?? '',
    questionDatas: survey.questionDatas.map((question) => ({
      key: question.key,
      text: question.text,
      description: question.description ?? '',
      sequenceNo: question.sequenceNo,
      responseDatas: question.responseDatas.map((response) => ({
        text: response.text,
        value: String(response.value),
        sequenceNo: response.sequenceNo
      }))
    }))
  };
}

export function withSurveySequenceNumbers(
  questionDatas: SurveyQuestionInput[]
): SurveyQuestionInput[] {
  return questionDatas.map((question, questionIndex) => ({
    ...question,
    sequenceNo: questionIndex + 1,
    responseDatas: question.responseDatas.map((response, responseIndex) => ({
      ...response,
      sequenceNo: responseIndex + 1
    }))
  }));
}
