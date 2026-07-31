'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { FormLabel } from '@/components/composites/form-label';
import { Field, FieldContent } from '@/components/ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';

export interface VerificationCodeFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Number of code characters (6 for TOTP; email/SMS follow tenant OTP length). */
  length?: number;
  /** Called when every slot is filled (paste-friendly auto-submit). */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  containerClassName?: string;
}

function OtpSlots({ length }: { length: number }) {
  if (length === 6) {
    return (
      <>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </>
    );
  }

  return (
    <InputOTPGroup>
      {Array.from({ length }, (_, index) => (
        <InputOTPSlot key={index} index={index} />
      ))}
    </InputOTPGroup>
  );
}

export function VerificationCodeField({
  id,
  label,
  value,
  onChange,
  length = 6,
  onComplete,
  disabled,
  autoFocus,
  className,
  containerClassName
}: VerificationCodeFieldProps) {
  return (
    <Field className={className}>
      <FormLabel htmlFor={id} required>
        {label}
      </FormLabel>
      <FieldContent>
        <InputOTP
          id={id}
          maxLength={length}
          value={value}
          onChange={onChange}
          onComplete={onComplete}
          disabled={disabled}
          autoFocus={autoFocus}
          pattern={REGEXP_ONLY_DIGITS}
          inputMode="numeric"
          autoComplete="one-time-code"
          containerClassName={cn('justify-center sm:justify-start', containerClassName)}
        >
          <OtpSlots length={length} />
        </InputOTP>
      </FieldContent>
    </Field>
  );
}
