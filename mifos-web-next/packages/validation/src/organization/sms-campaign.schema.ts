/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const smsCampaignParamValueSchema = z
  .record(z.union([z.string(), z.number(), z.boolean()]))
  .and(z.object({ reportName: z.string().trim().min(1) }));

export const createSmsCampaignSchema = z
  .object({
    campaignName: z.string().trim().min(1, 'Campaign name is required').max(200),
    triggerType: z.coerce.number().int().positive('Trigger type is required'),
    runReportId: z.coerce.number().int().positive('Business rule is required'),
    isNotification: z.boolean().default(false),
    providerId: z.coerce.number().int().nonnegative().nullable().optional(),
    message: z.string().trim().min(1, 'Message is required'),
    paramValue: smsCampaignParamValueSchema,
    recurrenceStartDate: z.string().trim().optional(),
    frequency: z.coerce.number().int().optional(),
    interval: z.coerce.number().int().optional(),
    repeatsOnDay: z.coerce.number().int().optional(),
    locale: z.string().optional(),
    dateFormat: z.string().optional(),
    dateTimeFormat: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.triggerType !== 2) {
      return;
    }
    if (!data.recurrenceStartDate?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule date is required',
        path: ['recurrenceStartDate']
      });
    }
    if (data.frequency == null || data.frequency < 1 || data.frequency > 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Repetition frequency is required',
        path: ['frequency']
      });
    }
    if (data.interval == null || data.interval < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Repetition interval is required',
        path: ['interval']
      });
    }
    if (data.frequency === 2 && (data.repeatsOnDay == null || data.repeatsOnDay < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Repeats on day is required for weekly schedules',
        path: ['repeatsOnDay']
      });
    }
  });

export const updateSmsCampaignSchema = z.object({
  campaignName: z.string().trim().min(1, 'Campaign name is required').max(200),
  triggerType: z.coerce.number().int().positive(),
  runReportId: z.coerce.number().int().positive(),
  isNotification: z.boolean(),
  providerId: z.coerce.number().int().nonnegative().nullable().optional(),
  message: z.string().trim().min(1, 'Message is required'),
  paramValue: smsCampaignParamValueSchema,
  recurrenceStartDate: z.string().trim().optional(),
  locale: z.string().optional(),
  dateFormat: z.string().optional(),
  dateTimeFormat: z.string().optional()
});

export const smsCampaignActivateCommandSchema = z.object({
  activationDate: z.string().trim().min(1, 'Activation date is required'),
  locale: z.string().optional(),
  dateFormat: z.string().optional()
});

export const smsCampaignCloseCommandSchema = z.object({
  closureDate: z.string().trim().min(1, 'Closure date is required'),
  locale: z.string().optional(),
  dateFormat: z.string().optional()
});

export const smsCampaignMessagesQuerySchema = z.object({
  status: z.coerce.number().int().positive(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  locale: z.string().optional(),
  dateFormat: z.string().optional()
});

export type CreateSmsCampaignInput = z.input<typeof createSmsCampaignSchema>;
export type CreateSmsCampaignPayload = z.output<typeof createSmsCampaignSchema>;
export type UpdateSmsCampaignInput = z.input<typeof updateSmsCampaignSchema>;
export type UpdateSmsCampaignPayload = z.output<typeof updateSmsCampaignSchema>;
export type SmsCampaignActivateCommandInput = z.input<typeof smsCampaignActivateCommandSchema>;
export type SmsCampaignCloseCommandInput = z.input<typeof smsCampaignCloseCommandSchema>;
export type SmsCampaignMessagesQueryInput = z.input<typeof smsCampaignMessagesQuerySchema>;

export function validateCreateSmsCampaign(input: unknown) {
  return createSmsCampaignSchema.safeParse(input);
}

export function validateUpdateSmsCampaign(input: unknown) {
  return updateSmsCampaignSchema.safeParse(input);
}

export function validateSmsCampaignActivateCommand(input: unknown) {
  return smsCampaignActivateCommandSchema.safeParse(input);
}

export function validateSmsCampaignCloseCommand(input: unknown) {
  return smsCampaignCloseCommandSchema.safeParse(input);
}

export function validateSmsCampaignMessagesQuery(input: unknown) {
  return smsCampaignMessagesQuerySchema.safeParse(input);
}
