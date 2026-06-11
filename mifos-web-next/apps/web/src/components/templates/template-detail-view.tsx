'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractTemplateDetail } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteTemplateAction } from '@/actions/templates';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function TemplateDetailView({
  template,
  canUpdate,
  canDelete
}: {
  template: FineractTemplateDetail;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteTemplateAction(template.id);
      if (!result.ok) {
        setActionError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success('Template deleted.');
      router.push('/templates');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href="/templates" label="Back to templates" />}
            title={template.name}
            meta={`${template.entity} · ${template.type}`}
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Link
                    href={`/templates/${template.id}/edit`}
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Link>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    disabled={pending}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
        }
        summary={
          <DetailFieldGrid columns={2}>
            <DetailField label="Entity">{template.entity}</DetailField>
            <DetailField label="Type">{template.type}</DetailField>
            <DetailField label="Mappers">{template.mappers.length}</DetailField>
          </DetailFieldGrid>
        }
      >
        <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <DetailField label="Template text">
            <div
              className="prose prose-sm max-w-none text-foreground dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: template.text }}
            />
          </DetailField>

          {template.mappers.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Mappers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {template.mappers.map((mapper, index) => (
                  <li
                    key={`${mapper.mapperskey}-${mapper.mappersorder}-${index}`}
                    className="rounded-md border border-border px-3 py-2"
                  >
                    <span className="font-medium text-foreground">{mapper.mapperskey}</span>
                    <span className="mx-2">→</span>
                    <code className="text-xs">{mapper.mappersvalue}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      <Can permission="DELETE_TEMPLATE">
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete template</DialogTitle>
              <DialogDescription>
                Delete &ldquo;{template.name}&rdquo;? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
                {pending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Can>
    </>
  );
}
