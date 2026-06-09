/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const surveyResponseValueSchema = z
  .string()
  .trim()
  .min(1, 'Value is required.')
  .regex(/^-?\d{1,4}$/, 'Value must be a number with at most 4 digits.');

export const surveyResponseSchema = z.object({
  text: z.string().trim().min(1, 'Option text is required.'),
  value: surveyResponseValueSchema,
  sequenceNo: z.number().int().positive().optional()
});

export const surveyQuestionSchema = z.object({
  key: z.string().trim().min(1, 'Question key is required.'),
  text: z.string().trim().min(1, 'Question text is required.'),
  description: z.string().optional(),
  sequenceNo: z.number().int().positive().optional(),
  responseDatas: z.array(surveyResponseSchema).min(1, 'Add at least one response option.')
});

export const upsertSurveyFormSchema = z.object({
  key: z.string().trim().min(1, 'Key is required.'),
  name: z.string().trim().min(1, 'Name is required.'),
  countryCode: z
    .string()
    .trim()
    .min(1, 'Country code is required.')
    .regex(/^[A-Za-z]{2}$/, 'Country code must be a 2-letter code.'),
  description: z.string().optional(),
  questionDatas: z.array(surveyQuestionSchema).min(1, 'Add at least one question.')
});

export type SurveyResponseInput = z.infer<typeof surveyResponseSchema>;
export type SurveyQuestionInput = z.infer<typeof surveyQuestionSchema>;
export type UpsertSurveyFormInput = z.infer<typeof upsertSurveyFormSchema>;

export function validateUpsertSurveyForm(input: unknown) {
  return upsertSurveyFormSchema.safeParse(input);
}

export function buildSurveyApiPayload(input: UpsertSurveyFormInput) {
  return {
    key: input.key.trim(),
    name: input.name.trim(),
    countryCode: input.countryCode.trim().toUpperCase(),
    description: input.description?.trim() || undefined,
    questionDatas: input.questionDatas.map((question, questionIndex) => ({
      key: question.key.trim(),
      text: question.text.trim(),
      description: question.description?.trim() || undefined,
      sequenceNo: questionIndex + 1,
      responseDatas: question.responseDatas.map((response, responseIndex) => ({
        text: response.text.trim(),
        value: Number(response.value),
        sequenceNo: responseIndex + 1
      }))
    }))
  };
}
