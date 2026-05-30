'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ServerActionResult } from '@/actions/servers';

export interface ServerFormValues {
  name: string;
  baseUrl: string;
  tenantId: string;
}

const DEFAULT_VALUES: ServerFormValues = {
  name: '',
  baseUrl: '',
  tenantId: 'default'
};

export function ServerForm({
  initialValues = DEFAULT_VALUES,
  submitLabel,
  onSubmit
}: {
  initialValues?: ServerFormValues;
  submitLabel: string;
  onSubmit: (values: ServerFormValues) => Promise<ServerActionResult>;
}) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(values);
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="server-name">Name</Label>
        <Input
          id="server-name"
          placeholder="Production, Sandbox, Local…"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="server-url">Server URL</Label>
        <Input
          id="server-url"
          placeholder="https://my-server.org"
          value={values.baseUrl}
          onChange={(e) => setValues((v) => ({ ...v, baseUrl: e.target.value }))}
          required
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Hostname only, or include the path (e.g. …/fineract-provider/api/v1).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="server-tenant">Tenant</Label>
        <Input
          id="server-tenant"
          placeholder="default"
          value={values.tenantId}
          onChange={(e) => setValues((v) => ({ ...v, tenantId: e.target.value }))}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
