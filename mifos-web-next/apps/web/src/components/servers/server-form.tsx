'use client';

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
  baseUrl: 'http://localhost:8443/fineract-provider/api/v1',
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
        <Label htmlFor="server-name">Display name</Label>
        <Input
          id="server-name"
          placeholder="Production, Sandbox, Local…"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="server-url">API base URL</Label>
        <Input
          id="server-url"
          placeholder="https://host/fineract-provider/api/v1"
          value={values.baseUrl}
          onChange={(e) => setValues((v) => ({ ...v, baseUrl: e.target.value }))}
          required
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Full Fineract API path (no trailing slash). Used only by the app server, not exposed to
          Fineract from the browser.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="server-tenant">Tenant ID</Label>
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
