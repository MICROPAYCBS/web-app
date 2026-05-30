/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSheet } from '@/components/composites/form-sheet';
import { cn } from '@/lib/utils';

const noteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  externalId: z.string().optional()
});

type NoteForm = z.infer<typeof noteSchema>;

const NOTE_FORM_ID = 'dashboard-note-form';

export default function DashboardPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid }
  } = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    mode: 'onChange',
    defaultValues: { name: '', externalId: '' }
  });

  function onSubmit(data: NoteForm) {
    console.info('Sheet submit', data);
    setSheetOpen(false);
    reset();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-2 text-muted-foreground">
          Greenfield Fineract client on Next.js 16.2.6 with preset-driven shadcn theming,
          Fineract-first validation, and FormSheet for simple forms (≤7 fields).
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/clients" className={cn(buttonVariants())}>
          Clients
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }))}>
          Login
        </Link>
        <Button type="button" variant="secondary" onClick={() => setSheetOpen(true)}>
          Open FormSheet demo
        </Button>
      </div>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Add note"
        description="Simple forms (1–7 fields) use a side sheet with Cancel/Submit in the footer."
        formId={NOTE_FORM_ID}
        submitLabel="Save"
        submitDisabled={!isValid}
        submitLoading={isSubmitting}
        onCancel={() => reset()}
      >
        <form id={NOTE_FORM_ID} className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="note-name">Name</Label>
            <Input id="note-name" {...register('name')} aria-invalid={!!errors.name} />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-external-id">External ID</Label>
            <Input id="note-external-id" {...register('externalId')} />
          </div>
        </form>
      </FormSheet>
    </div>
  );
}
