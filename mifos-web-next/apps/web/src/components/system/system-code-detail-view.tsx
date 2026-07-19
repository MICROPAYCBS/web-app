'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCode, FineractCodeValue } from '@mifos/api-client';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteCodeAction } from '@/actions/system-code';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { SystemCodeGeneralPanel } from '@/components/system/system-code-general-panel';
import { SystemCodeValuesEditor } from '@/components/system/system-code-values-editor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';

export function SystemCodeDetailView({
  code,
  codeValues,
  canDeleteCode,
  defaultTab = 'values'
}: {
  code: FineractCode;
  codeValues: FineractCodeValue[];
  canDeleteCode: boolean;
  defaultTab?: 'general' | 'values';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const systemDefined = code.systemDefined === true;
  const showDelete = canDeleteCode && !systemDefined;

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteCodeAction(code.id);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteOpen(false);
      router.push('/system/codes');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href="/system/codes" label="Back to codes" />}
            title={`Edit code: ${code.name}`}
            status={
              systemDefined
                ? { label: 'System defined', variant: 'secondary' }
                : { label: 'Custom', variant: 'outline' }
            }
            meta="Manage code details and associated values."
            actions={
              showDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  disabled={pending}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete code
                </Button>
              ) : null
            }
          />
        }
        summary={
          <DetailFieldGrid columns={2}>
            <DetailField label="System defined">{formatYesNo(systemDefined)}</DetailField>
            <DetailField label="Values">{codeValues.length}</DetailField>
          </DetailFieldGrid>
        }
      >
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General details</TabsTrigger>
            <TabsTrigger value="values">Code values</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="pt-2">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <SystemCodeGeneralPanel
                codeId={code.id}
                initialName={code.name}
                systemDefined={systemDefined}
                valueCount={codeValues.length}
              />
            </div>
          </TabsContent>

          <TabsContent value="values" className="pt-2">
            <SystemCodeValuesEditor codeId={code.id} initialValues={codeValues} />
          </TabsContent>
        </Tabs>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete code</DialogTitle>
            <DialogDescription>
              Delete code &ldquo;{code.name}&rdquo; and all of its values? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
