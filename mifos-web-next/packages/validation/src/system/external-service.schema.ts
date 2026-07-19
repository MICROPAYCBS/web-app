/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { z } from 'zod';



const requiredString = z.string().trim().min(1, 'This field is required.');



export const updateS3ExternalServiceSchema = z.object({

  s3_access_key: requiredString,

  s3_bucket_name: requiredString,

  s3_secret_key: requiredString

});



export const updateSmtpExternalServiceSchema = z.object({

  username: requiredString,

  password: requiredString,

  host: requiredString,

  port: requiredString,

  useTLS: z.boolean(),

  fromEmail: requiredString.email('Enter a valid email address.'),

  fromName: requiredString

});



export const updateSmsExternalServiceSchema = z.object({

  host_name: requiredString,

  port_number: requiredString,

  end_point: requiredString,

  tenant_app_key: requiredString

});



export const updateNotificationExternalServiceSchema = z.object({

  server_key: requiredString,

  gcm_end_point: requiredString,

  fcm_end_point: requiredString

});



export type UpdateS3ExternalServiceInput = z.infer<typeof updateS3ExternalServiceSchema>;

export type UpdateSmtpExternalServiceInput = z.infer<typeof updateSmtpExternalServiceSchema>;

export type UpdateSmsExternalServiceInput = z.infer<typeof updateSmsExternalServiceSchema>;

export type UpdateNotificationExternalServiceInput = z.infer<

  typeof updateNotificationExternalServiceSchema

>;



export function validateUpdateS3ExternalService(input: unknown) {

  return updateS3ExternalServiceSchema.safeParse(input);

}



export function validateUpdateSmtpExternalService(input: unknown) {

  return updateSmtpExternalServiceSchema.safeParse(input);

}



export function validateUpdateSmsExternalService(input: unknown) {

  return updateSmsExternalServiceSchema.safeParse(input);

}



export function validateUpdateNotificationExternalService(input: unknown) {

  return updateNotificationExternalServiceSchema.safeParse(input);

}


