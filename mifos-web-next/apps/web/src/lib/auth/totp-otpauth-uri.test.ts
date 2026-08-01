/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest';
import { rebrandTotpOtpauthUri } from './totp-otpauth-uri';

describe('rebrandTotpOtpauthUri', () => {
  it('replaces Fineract issuer and label with MicroPay', () => {
    const input =
      'otpauth://totp/Fineract%3Aadmin?secret=JBSWY3DPEHPK3PXP&issuer=Fineract&digits=6&period=30';
    const output = rebrandTotpOtpauthUri(input, 'MicroPay');
    expect(output).toBe(
      'otpauth://totp/MicroPay%3Aadmin?secret=JBSWY3DPEHPK3PXP&issuer=MicroPay&digits=6&period=30'
    );
  });

  it('returns original URI when not otpauth totp', () => {
    const input = 'https://example.com';
    expect(rebrandTotpOtpauthUri(input, 'MicroPay')).toBe(input);
  });
});
