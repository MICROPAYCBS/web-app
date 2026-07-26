/** Cookie name for serialized {@link SessionUser} (replace with encrypted session in production). */
export const SESSION_COOKIE_NAME = 'mifos-session';

/** Short-lived cookie while waiting for OTP after password login (2FA). */
export const TWO_FACTOR_PENDING_COOKIE_NAME = 'mifos-2fa-pending';

/** Pending 2FA cookie TTL (~10 minutes). */
export const TWO_FACTOR_PENDING_MAX_AGE = 60 * 10;
