'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractTwoFactorConfiguration, OtpDeliveryMethod } from '@mifos/api-client';
import { Can, resolvePermission } from '@mifos/auth';
import { formatActionErrorMessage, validateUpdateTwoFactorConfiguration } from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { updateTwoFactorConfigurationAction } from '@/actions/twofactor-configuration';
import { ListPage } from '@/components/composites/list-page';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type FormState = {
  otpDeliveryMethod: OtpDeliveryMethod;
  emailSubject: string;
  emailBody: string;
  smsProviderId: number;
  smsText: string;
  otpTokenLiveTime: number;
  otpTokenLength: number;
  accessTokenLiveTime: number;
  accessTokenLiveTimeExtended: number;
};

const DELIVERY_METHOD_LABELS: Record<OtpDeliveryMethod, string> = {
  email: 'Email',
  sms: 'SMS',
  totp: 'Authenticator app'
};

function formFromConfiguration(config: FineractTwoFactorConfiguration): FormState {
  return {
    otpDeliveryMethod: config.otpDeliveryMethod,
    emailSubject: config.emailSubject,
    emailBody: config.emailBody,
    smsProviderId: config.smsProviderId,
    smsText: config.smsText,
    otpTokenLiveTime: config.otpTokenLiveTime,
    otpTokenLength: config.otpTokenLength,
    accessTokenLiveTime: config.accessTokenLiveTime,
    accessTokenLiveTimeExtended: config.accessTokenLiveTimeExtended
  };
}

function configsEqual(left: FormState, right: FormState): boolean {
  return (
    left.otpDeliveryMethod === right.otpDeliveryMethod &&
    left.emailSubject === right.emailSubject &&
    left.emailBody === right.emailBody &&
    left.smsProviderId === right.smsProviderId &&
    left.smsText === right.smsText &&
    left.otpTokenLiveTime === right.otpTokenLiveTime &&
    left.otpTokenLength === right.otpTokenLength &&
    left.accessTokenLiveTime === right.accessTokenLiveTime &&
    left.accessTokenLiveTimeExtended === right.accessTokenLiveTimeExtended
  );
}

export function TwoFactorConfigurationPageContent({
  configuration,
  canUpdate,
  unavailableMessage
}: {
  configuration: FineractTwoFactorConfiguration | null;
  canUpdate: boolean;
  unavailableMessage?: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(
    configuration ? formFromConfiguration(configuration) : null
  );
  const [baseline, setBaseline] = useState<FormState | null>(
    configuration ? formFromConfiguration(configuration) : null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!configuration) {
      setForm(null);
      setBaseline(null);
      return;
    }
    const next = formFromConfiguration(configuration);
    setForm(next);
    setBaseline(next);
    setFieldErrors({});
    setSubmitError(null);
  }, [configuration]);

  if (unavailableMessage || !form || !baseline) {
    return (
      <ListPage
        title="Two-factor authentication"
        description="Configure how verification codes are delivered after sign-in."
      >
        <Card>
          <CardHeader>
            <CardTitle>Not available on this server</CardTitle>
            <CardDescription>
              {unavailableMessage ??
                'Two-factor authentication is not enabled on the connected server.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ask your platform operator to enable two-factor authentication on the application
            server and restart it, then return here to choose a delivery method.
          </CardContent>
        </Card>
      </ListPage>
    );
  }

  const dirty = !configsEqual(form, baseline);
  const disabled = pending || !canUpdate;

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function handleReset() {
    if (!baseline) {
      return;
    }
    setForm({ ...baseline });
    setFieldErrors({});
    setSubmitError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !canUpdate) {
      return;
    }

    const parsed = validateUpdateTwoFactorConfiguration(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    setFieldErrors({});
    setSubmitError(null);

    startTransition(async () => {
      const result = await updateTwoFactorConfigurationAction(parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toastCommandOutcome(result, {
        completed: 'Two-factor settings saved.',
        pending: 'Two-factor settings sent for approval.'
      });
      const saved = formFromConfiguration({
        ...configuration!,
        ...parsed.data,
        emailEnabled: parsed.data.otpDeliveryMethod === 'email',
        smsEnabled: parsed.data.otpDeliveryMethod === 'sms'
      });
      setBaseline(saved);
      setForm(saved);
      router.refresh();
    });
  }

  return (
    <ListPage
      title="Two-factor authentication"
      description="Choose how staff verify their identity after password sign-in, and how long codes and sessions last."
    >
      <form className="mx-auto max-w-3xl space-y-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Delivery method</CardTitle>
            <CardDescription>
              Exactly one method applies tenant-wide. Staff cannot choose a different channel at
              sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="otpDeliveryMethod" className="text-sm font-medium">
                Verification method
              </label>
              <Select
                value={form.otpDeliveryMethod}
                onValueChange={(value) => patch('otpDeliveryMethod', value as OtpDeliveryMethod)}
                disabled={disabled}
              >
                <SelectTrigger id="otpDeliveryMethod" className="w-full max-w-sm">
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DELIVERY_METHOD_LABELS) as OtpDeliveryMethod[]).map((method) => (
                    <SelectItem key={method} value={method}>
                      {DELIVERY_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.otpDeliveryMethod ? (
                <p className="text-sm text-destructive">{fieldErrors.otpDeliveryMethod}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {form.otpDeliveryMethod === 'email' ? (
          <Card>
            <CardHeader>
              <CardTitle>Email delivery</CardTitle>
              <CardDescription>
                Requires a working email connection under{' '}
                <Link href="/system/external-services" className="underline underline-offset-2">
                  External services
                </Link>
                . Use <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{username}}'}</code>{' '}
                and <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{token}}'}</code> in
                templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                id="emailSubject"
                label="Email subject"
                value={form.emailSubject}
                onChange={(value) => patch('emailSubject', value)}
                error={fieldErrors.emailSubject}
                disabled={disabled}
                required
              />
              <TextField
                id="emailBody"
                label="Email body"
                value={form.emailBody}
                onChange={(value) => patch('emailBody', value)}
                error={fieldErrors.emailBody}
                disabled={disabled}
                multiline
                rows={4}
                required
              />
            </CardContent>
          </Card>
        ) : null}

        {form.otpDeliveryMethod === 'sms' ? (
          <Card>
            <CardHeader>
              <CardTitle>SMS delivery</CardTitle>
              <CardDescription>
                Requires an SMS provider under{' '}
                <Link href="/system/external-services" className="underline underline-offset-2">
                  External services
                </Link>
                . The provider ID is the numeric SMS gateway identifier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                id="smsProviderId"
                label="SMS provider ID"
                type="number"
                inputMode="numeric"
                value={String(form.smsProviderId)}
                onChange={(value) => patch('smsProviderId', Number(value) || 0)}
                error={fieldErrors.smsProviderId}
                disabled={disabled}
                required
              />
              <TextField
                id="smsText"
                label="SMS message"
                value={form.smsText}
                onChange={(value) => patch('smsText', value)}
                error={fieldErrors.smsText}
                disabled={disabled}
                multiline
                rows={3}
                required
              />
            </CardContent>
          </Card>
        ) : null}

        {form.otpDeliveryMethod === 'totp' ? (
          <Card>
            <CardHeader>
              <CardTitle>Authenticator app</CardTitle>
              <CardDescription>
                Staff sign in with a time-based one-time password from an app such as Google
                Authenticator or Microsoft Authenticator. Each user enrolls on first sign-in after
                you enable this method.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No email or SMS templates are used for this method. Use{' '}
              <Link href="/appusers" className="underline underline-offset-2">
                Users
              </Link>{' '}
              to reset enrollment when someone loses their device.
            </CardContent>
          </Card>
        ) : null}

        {form.otpDeliveryMethod !== 'totp' ? (
          <Card>
            <CardHeader>
              <CardTitle>Verification code</CardTitle>
              <CardDescription>
                Length and lifetime of the one-time code sent to the user.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="otpTokenLength"
                label="Code length"
                type="number"
                inputMode="numeric"
                value={String(form.otpTokenLength)}
                onChange={(value) => patch('otpTokenLength', Number(value) || 0)}
                error={fieldErrors.otpTokenLength}
                disabled={disabled}
                required
              />
              <TextField
                id="otpTokenLiveTime"
                label="Code lifetime (seconds)"
                type="number"
                inputMode="numeric"
                value={String(form.otpTokenLiveTime)}
                onChange={(value) => patch('otpTokenLiveTime', Number(value) || 0)}
                error={fieldErrors.otpTokenLiveTime}
                disabled={disabled}
                required
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Signed-in session after verification</CardTitle>
            <CardDescription>
              How long the two-factor access token stays valid after a successful code check.
              Extended applies when the user opts for a longer session at verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="accessTokenLiveTime"
              label="Standard lifetime (seconds)"
              type="number"
              inputMode="numeric"
              value={String(form.accessTokenLiveTime)}
              onChange={(value) => patch('accessTokenLiveTime', Number(value) || 0)}
              error={fieldErrors.accessTokenLiveTime}
              disabled={disabled}
              required
            />
            <TextField
              id="accessTokenLiveTimeExtended"
              label="Extended lifetime (seconds)"
              type="number"
              inputMode="numeric"
              value={String(form.accessTokenLiveTimeExtended)}
              onChange={(value) => patch('accessTokenLiveTimeExtended', Number(value) || 0)}
              error={fieldErrors.accessTokenLiveTimeExtended}
              disabled={disabled}
              required
            />
          </CardContent>
        </Card>

        {submitError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

        <Can permission={resolvePermission('system.twoFactor.update')}>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!dirty || pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" disabled={!dirty || pending} onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Can>
      </form>
    </ListPage>
  );
}
