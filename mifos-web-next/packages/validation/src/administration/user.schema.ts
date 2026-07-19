/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const personNamePattern = /^[A-Za-z].*/;
const passwordPattern =
  /^(?!.*(.)\1)(?!.*\s)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\s]).{12,50}$/;

const roleIdsSchema = z
  .array(z.number().int().positive())
  .min(1, 'Select at least one role.');

const userSignInPolicyFields = {
  passwordNeverExpires: z.boolean().optional(),
  isLoginRetriesEnabled: z.boolean().optional(),
  isPasswordResetAllowed: z.boolean().optional()
};

const userIdentityFields = {
  username: z.string().trim().min(1, 'Login name is required.'),
  firstname: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .regex(personNamePattern, 'First name must start with a letter.'),
  lastname: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .regex(personNamePattern, 'Last name must start with a letter.'),
  officeId: z.number().int().positive('Branch is required.'),
  roles: roleIdsSchema,
  ...userSignInPolicyFields
};

export const createUserSchema = z
  .object({
    ...userIdentityFields,
    staffId: z.number().int().positive().optional(),
    email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
    sendPasswordToEmail: z.boolean().default(false),
    password: z.string().optional(),
    repeatPassword: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (value.sendPasswordToEmail) {
      if (!value.email?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email is required when sending the password by email.',
          path: ['email']
        });
      }
      return;
    }

    if (!value.password?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password is required.',
        path: ['password']
      });
    } else if (!passwordPattern.test(value.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Password must be 12 to 50 characters and include uppercase, lowercase, number, and special character.',
        path: ['password']
      });
    }

    if (!value.repeatPassword?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Confirm password is required.',
        path: ['repeatPassword']
      });
    } else if (value.password !== value.repeatPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['repeatPassword']
      });
    }
  });

export const updateUserSchema = z
  .object({
    ...userIdentityFields,
    staffId: z.number().int().positive().nullable().optional(),
    email: z.string().trim().optional().or(z.literal(''))
  })
  .superRefine((value, ctx) => {
    const email = value.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid email address.',
        path: ['email']
      });
    }
  });

export const changeUserPasswordSchema = z
  .object({
    firstname: z.string().trim().min(1, 'First name is required.'),
    password: z
      .string()
      .min(1, 'Password is required.')
      .regex(
        passwordPattern,
        'Password must be 12 to 50 characters and include uppercase, lowercase, number, and special character.'
      ),
    repeatPassword: z.string().min(1, 'Confirm password is required.')
  })
  .refine((value) => value.password === value.repeatPassword, {
    message: 'Passwords do not match.',
    path: ['repeatPassword']
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>;

export function validateCreateUser(input: unknown) {
  return createUserSchema.safeParse(input);
}

export function validateUpdateUser(input: unknown) {
  return updateUserSchema.safeParse(input);
}

export function validateChangeUserPassword(input: unknown) {
  return changeUserPasswordSchema.safeParse(input);
}
