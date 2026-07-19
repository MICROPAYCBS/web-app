'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SurveyQuestionInput } from '@mifos/validation';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { defaultSurveyQuestion, withSurveySequenceNumbers } from '@/lib/fineract/survey-display';

export function SurveyQuestionsEditor({
  questions,
  onChange,
  fieldErrors,
  disabled = false
}: {
  questions: SurveyQuestionInput[];
  onChange: (questions: SurveyQuestionInput[]) => void;
  fieldErrors: Record<string, string>;
  disabled?: boolean;
}) {
  function updateQuestions(next: SurveyQuestionInput[]) {
    onChange(withSurveySequenceNumbers(next));
  }

  function patchQuestion(index: number, patch: Partial<SurveyQuestionInput>) {
    updateQuestions(
      questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      )
    );
  }

  function addQuestion() {
    updateQuestions([...questions, defaultSurveyQuestion()]);
  }

  function removeQuestion(index: number) {
    updateQuestions(questions.filter((_, questionIndex) => questionIndex !== index));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) {
      return;
    }
    const next = [...questions];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateQuestions(next);
  }

  function patchResponse(questionIndex: number, responseIndex: number, patch: { text?: string; value?: string }) {
    const question = questions[questionIndex];
    if (!question) {
      return;
    }
    patchQuestion(questionIndex, {
      responseDatas: question.responseDatas.map((response, currentIndex) =>
        currentIndex === responseIndex ? { ...response, ...patch } : response
      )
    });
  }

  function addResponse(questionIndex: number) {
    const question = questions[questionIndex];
    if (!question) {
      return;
    }
    patchQuestion(questionIndex, {
      responseDatas: [...question.responseDatas, { text: '', value: '' }]
    });
  }

  function removeResponse(questionIndex: number, responseIndex: number) {
    const question = questions[questionIndex];
    if (!question || question.responseDatas.length <= 1) {
      return;
    }
    patchQuestion(questionIndex, {
      responseDatas: question.responseDatas.filter((_, currentIndex) => currentIndex !== responseIndex)
    });
  }

  function moveResponse(questionIndex: number, responseIndex: number, direction: -1 | 1) {
    const question = questions[questionIndex];
    if (!question) {
      return;
    }
    const target = responseIndex + direction;
    if (target < 0 || target >= question.responseDatas.length) {
      return;
    }
    const nextResponses = [...question.responseDatas];
    const [item] = nextResponses.splice(responseIndex, 1);
    nextResponses.splice(target, 0, item);
    patchQuestion(questionIndex, { responseDatas: nextResponses });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Questions</h3>
          <p className="text-sm text-muted-foreground">
            Add questions and response options for each question.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion} disabled={disabled}>
          <Plus className="mr-2 size-4" />
          Add question
        </Button>
      </div>

      {fieldErrors.questionDatas ? (
        <p className="text-sm text-destructive">{fieldErrors.questionDatas}</p>
      ) : null}

      <div className="space-y-4">
        {questions.map((question, questionIndex) => (
          <div
            key={`question-${questionIndex}`}
            className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-medium">Question {questionIndex + 1}</h4>
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move question ${questionIndex + 1} up`}
                  disabled={disabled || questionIndex === 0}
                  onClick={() => moveQuestion(questionIndex, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move question ${questionIndex + 1} down`}
                  disabled={disabled || questionIndex === questions.length - 1}
                  onClick={() => moveQuestion(questionIndex, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  aria-label={`Remove question ${questionIndex + 1}`}
                  disabled={disabled || questions.length <= 1}
                  onClick={() => removeQuestion(questionIndex)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Question key"
                required
                value={question.key}
                onChange={(value) => patchQuestion(questionIndex, { key: value })}
                error={fieldErrors[`questionDatas.${questionIndex}.key`]}
                disabled={disabled}
              />
              <TextField
                label="Question text"
                required
                value={question.text}
                onChange={(value) => patchQuestion(questionIndex, { text: value })}
                error={fieldErrors[`questionDatas.${questionIndex}.text`]}
                disabled={disabled}
              />
            </div>

            <TextField
              label="Description"
              optional
              multiline
              rows={2}
              value={question.description ?? ''}
              onChange={(value) => patchQuestion(questionIndex, { description: value })}
              error={fieldErrors[`questionDatas.${questionIndex}.description`]}
              disabled={disabled}
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h5 className="text-sm font-medium">Response options</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addResponse(questionIndex)}
                  disabled={disabled}
                >
                  <Plus className="mr-2 size-4" />
                  Add option
                </Button>
              </div>

              {fieldErrors[`questionDatas.${questionIndex}.responseDatas`] ? (
                <p className="text-sm text-destructive">
                  {fieldErrors[`questionDatas.${questionIndex}.responseDatas`]}
                </p>
              ) : null}

              <div className="space-y-3">
                {question.responseDatas.map((response, responseIndex) => (
                  <div
                    key={`response-${questionIndex}-${responseIndex}`}
                    className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <TextField
                      label="Option text"
                      required
                      value={response.text}
                      onChange={(value) => patchResponse(questionIndex, responseIndex, { text: value })}
                      error={
                        fieldErrors[`questionDatas.${questionIndex}.responseDatas.${responseIndex}.text`]
                      }
                      disabled={disabled}
                    />
                    <TextField
                      label="Value"
                      required
                      value={response.value}
                      onChange={(value) => patchResponse(questionIndex, responseIndex, { value })}
                      error={
                        fieldErrors[`questionDatas.${questionIndex}.responseDatas.${responseIndex}.value`]
                      }
                      disabled={disabled}
                    />
                    <div className="flex items-end gap-1 pb-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move option ${responseIndex + 1} up`}
                        disabled={disabled || responseIndex === 0}
                        onClick={() => moveResponse(questionIndex, responseIndex, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move option ${responseIndex + 1} down`}
                        disabled={disabled || responseIndex === question.responseDatas.length - 1}
                        onClick={() => moveResponse(questionIndex, responseIndex, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Remove option ${responseIndex + 1}`}
                        disabled={disabled || question.responseDatas.length <= 1}
                        onClick={() => removeResponse(questionIndex, responseIndex)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
