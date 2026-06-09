/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



/** Fineract externalservice/{servicename} property row. */

export interface FineractExternalServiceProperty {

  name: string;

  value: string;

}



/** Supported external service names on the Fineract API. */

export type FineractExternalServiceName = 'S3' | 'SMTP' | 'SMS' | 'NOTIFICATION';



export interface UpdateS3ExternalServicePayload {

  s3_access_key: string;

  s3_bucket_name: string;

  s3_secret_key: string;

}



export interface UpdateSmtpExternalServicePayload {

  username: string;

  password: string;

  host: string;

  port: string;

  useTLS: boolean;

  fromEmail: string;

  fromName: string;

}



export interface UpdateSmsExternalServicePayload {

  host_name: string;

  port_number: string;

  end_point: string;

  tenant_app_key: string;

}



export interface UpdateNotificationExternalServicePayload {

  server_key: string;

  gcm_end_point: string;

  fcm_end_point: string;

}


