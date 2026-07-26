import type { SessionUser } from '@mifos/auth';

/** Credentials that must never be sent to the browser. */
export interface FineractAuthSecrets {
  accessToken?: string;
  base64EncodedAuthenticationKey?: string;
  /** Access token from POST /twofactor/validate — sent as Fineract-Platform-TFA-Token. */
  twoFactorAccessToken?: string;
  /** ISO timestamp when the TFA token expires (informational). */
  twoFactorValidTo?: string;
}

/** Full session available only on the server (Route Handlers, Server Actions, RSC). */
export type ServerSession = SessionUser & FineractAuthSecrets;
